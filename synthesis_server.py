# coding: utf-8
"""
Synthesis waveform from trained model.

usage: synthesis.py [options] <checkpoint> <text_list_file> <dst_dir>

options:
    --hparams=<parmas>                Hyper parameters [default: ].
    --preset=<json>                   Path of preset parameters (json).
    --checkpoint-seq2seq=<path>       Load seq2seq model from checkpoint path.
    --checkpoint-postnet=<path>       Load postnet model from checkpoint path.
    --file-name-suffix=<s>            File name suffix [default: ].
    --max-decoder-steps=<N>           Max decoder steps [default: 500].
    --replace_pronunciation_prob=<N>  Prob [default: 0.0].
    --speaker_id=<id>                 Speaker ID (for multi-speaker model).
    --output-html                     Output html for blog post.
    -h, --help               Show help message.
"""
from docopt import docopt

import sys
import os
from os.path import dirname, join, basename, splitext

import audio

import torch
from torch.autograd import Variable
import numpy as np
import nltk

# The deepvoice3 model
from deepvoice3_pytorch import frontend
from hparams import hparams, hparams_debug_string

from tqdm import tqdm

use_cuda = torch.cuda.is_available()
_frontend = None  # to be set later

def send_http_ok_response(conn, body):
    # Reply as HTTP/1.1 server, saying "HTTP OK" (code 200).
    response_proto = 'HTTP/1.1'
    response_status = '200'
    response_status_text = 'OK' # this can be random

    response_headers = {
        'Content-Type': 'text/html; encoding=utf8',
        'Content-Length': len(body),
         'Connection': 'close',
    }

    response_headers_raw = ''.join('%s: %s\n' % (k, v) for k, v in response_headers.items())

    # sending all this stuff
    conn.send(('%s %s %s' % (response_proto, response_status, response_status_text)).encode())
    conn.send(response_headers_raw.encode())
    conn.send('\n'.encode()) # to separate headers from body
    conn.send(body.encode())

def recive_data(conn):
    data = conn.recv(4096)
    return data;

def tts_server(port):
    print('Server listen on : ', port)
    import socket

    HOST = ''# Symbolic name meaning the local host
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind((HOST, port))
    s.listen(1)
    conn, addr = s.accept()
    print("Socket connected : ", addr)
    return conn

def parseData(text):
    strToFind   = "tts_content"
    strIdx      = text.find(strToFind) + len(strToFind);
    jsonText    = text[strIdx:]

    import json
    from pprint import pprint
    data = json.loads(jsonText)
    pprint(data)
    return data["tts_frontend"], data["tts_text"]

def tts(model, text, p=0, speaker_id=None, fast=False):
    """Convert text to speech waveform given a deepvoice3 model.

    Args:
        text (str) : Input text to be synthesized
        p (float) : Replace word to pronounciation if p > 0. Default is 0.
    """
    if use_cuda:
        model = model.cuda()
    model.eval()
    if fast:
        model.make_generation_fast_()

    sequence = np.array(_frontend.text_to_sequence(text, p=p))
    sequence = Variable(torch.from_numpy(sequence)).unsqueeze(0).long()
    text_positions = torch.arange(1, sequence.size(-1) + 1).unsqueeze(0).long()
    text_positions = Variable(text_positions)
    speaker_ids = None if speaker_id is None else Variable(torch.LongTensor([speaker_id]))
    if use_cuda:
        sequence = sequence.cuda()
        text_positions = text_positions.cuda()
        speaker_ids = None if speaker_ids is None else speaker_ids.cuda()

    # Greedy decoding
    mel_outputs, linear_outputs, alignments, done = model(
        sequence, text_positions=text_positions, speaker_ids=speaker_ids)

    linear_output = linear_outputs[0].cpu().data.numpy()
    spectrogram = audio._denormalize(linear_output)
    alignment = alignments[0].cpu().data.numpy()
    mel = mel_outputs[0].cpu().data.numpy()
    mel = audio._denormalize(mel)

    # Predicted audio signal
    waveform = audio.inv_spectrogram(linear_output.T)

    return waveform, alignment, spectrogram, mel

if __name__ == "__main__":
    import os 
    print("Im running on PID ->" + str(os.getpid()))

    args = docopt(__doc__)
    print("Command line args:\n", args)
    checkpoint_path = args["<checkpoint>"]
    text_list_file_path = args["<text_list_file>"]
    dst_dir = args["<dst_dir>"]
    checkpoint_seq2seq_path = args["--checkpoint-seq2seq"]
    checkpoint_postnet_path = args["--checkpoint-postnet"]
    max_decoder_steps = int(args["--max-decoder-steps"])
    file_name_suffix = args["--file-name-suffix"]
    replace_pronunciation_prob = float(args["--replace_pronunciation_prob"])
    output_html = args["--output-html"]
    speaker_id = args["--speaker_id"]
    if speaker_id is not None:
        speaker_id = int(speaker_id)
    preset = args["--preset"]

    # Load preset if specified
    if preset is not None:
        with open(preset) as f:
            hparams.parse_json(f.read())
    # Override hyper parameters
    hparams.parse(args["--hparams"])
    assert hparams.name == "deepvoice3"

    _frontend = getattr(frontend, hparams.frontend)
    import train
    train._frontend = _frontend
    from train import plot_alignment, build_model

    # Model
    model = build_model()

    # Load checkpoints separately
    if checkpoint_postnet_path is not None and checkpoint_seq2seq_path is not None:
        checkpoint = torch.load(checkpoint_seq2seq_path)
        model.seq2seq.load_state_dict(checkpoint["state_dict"])
        checkpoint = torch.load(checkpoint_postnet_path)
        model.postnet.load_state_dict(checkpoint["state_dict"])
        checkpoint_name = splitext(basename(checkpoint_seq2seq_path))[0]
    else:
        checkpoint = torch.load(checkpoint_path)
        model.load_state_dict(checkpoint["state_dict"])
        checkpoint_name = splitext(basename(checkpoint_path))[0]

    model.seq2seq.decoder.max_decoder_steps = max_decoder_steps

    os.makedirs(dst_dir, exist_ok=True)

    idx = 0        
    while 1:
        conn = tts_server(2002)
        while 1:
            data = conn.recv(4096)
            if not data: break
     
            selected_frontend, text = parseData(data.decode("utf-8"))
            words = nltk.word_tokenize(text)
            waveform, alignment, _, _ = tts(
                model, text, p=replace_pronunciation_prob, speaker_id=speaker_id, fast=True)
            dst_wav_path = join(dst_dir, "{}_{}{}.wav".format(
                idx, checkpoint_name, file_name_suffix))
            dst_alignment_path = join(
                dst_dir, "{}_{}{}_alignment.png".format(idx, checkpoint_name,
                                                        file_name_suffix))
            plot_alignment(alignment.T, dst_alignment_path,
                           info="{}, {}".format(hparams.builder, basename(checkpoint_path)))
            audio.save_wav(waveform, dst_wav_path)
            print("Finished! Check out {} for generated audio samples. text is -> {}".format(dst_wav_path, text))

            from os.path import basename, splitext
            name = splitext(basename(text_list_file_path))[0]

            send_http_ok_response(conn, "state=completed")
            idx = idx+1;

        conn.close()
    
    sys.exit(0)
