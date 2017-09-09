/**
 * 
 */

const _ = require('lodash')
const jsonfile = require('jsonfile')
const path = require('path')
const fs = require("fs");
const JSONStream = require("JSONStream");
const debug = require('debug')('insuranceqa-corpus-zh')
const readlineq = require('readlineq')

/**
 * Stop words, also contain punctuations
 */
async function load_stopped_words() {
    const file = './tmp/stopwords.txt'
    var lines = await readlineq(file)
    return lines
}

function map_tokens_to_ids(tokens, vocab, stopwords) {
    let ids = [];
    for (let y in tokens) {
        let [word, tag] = tokens[y].split('\t');
        if (word && tag) {
            // debug('word', word);
            // debug('tag', tag);
            if (!stopwords.includes(word)) { // not a stop word
                if (vocab.word2id[word]) {
                    ids.push(vocab.word2id[word])
                } else {
                    ids.push(0) // for UNK word
                }
            }
        }
    }
    return ids;
}

function resolve_tokens(tokens, stopwords) {
    let ids = [];
    for (let y in tokens) {
        let [word, tag] = tokens[y].split('\t');
        if (word && tag) {
            // debug('word', word);
            // debug('tag', tag);
            if (!stopwords.includes(word)) { // not a stop word
                if (word) {
                    ids.push(word)
                } else {
                    ids.push('<unk>') // for UNK word
                }
            }
        }
    }
    return ids;
}

/**
 * Dump huge array to file
 * @param {*} to 
 * @param {*} obj 
 */
function dump_huge_array_to_file(to, obj) {
    return new Promise((resolve, reject) => {
        var records = obj
        var transformStream = JSONStream.stringify();
        var outputStream = fs.createWriteStream(to);
        transformStream.pipe(outputStream);
        records.forEach(transformStream.write);
        transformStream.end();

        outputStream.on(
            "finish",
            function handleFinish() {
                console.log("dump_huge_array_to_file done");
                resolve();
            }
        );
    });
}

/**
 * Dump huge array to file
 * @param {*} to 
 * @param {*} obj 
 */
function dump_lines_to_file(to, obj) {
    return new Promise((resolve, reject) => {
        for(let o in obj){
            fs.appendFileSync(to, obj[o]+'\n');
        }
    });
}

async function load_answers_collection() {
    const file = './tmp/iqa.answers.tokenlized';
    let data = {}
    let lines = await readlineq(file);
    for (let x in lines) {
        let [index, tokens] = lines[x].split("++$++")
        data[index.trim()] = tokens.trim()
    }
    return data;
}

function parse_raw_string_to_json(raw) {
    return JSON.parse(raw.replace(/(u)?'/g, '"'));
}

// the global async wrapper
(async function () {
    const vocab = require('../tmp/iqa.vocab.json')
    const stopwords = await load_stopped_words()
    let target_path = '../tmp/iqa.ngram-vocab';

    let word2ids = vocab['word2id'];
    // console.log('word2id', word2ids)
    let data = [];

    for(let o in word2ids){
        data.push(o);
    }

    console.log('data size', data.length, 'saved ', path.join(__dirname, target_path))
    await dump_lines_to_file(path.join(__dirname, target_path), data)
})();