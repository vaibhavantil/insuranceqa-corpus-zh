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

/**
 * Dump huge array to file
 * @param {*} to 
 * @param {*} obj 
 */
function dump_lines_to_file(to, obj) {
    return new Promise((resolve, reject) => {
        try {
            for (let o in obj) {
                fs.appendFileSync(to, obj[o] + '\n');
            }
            resolve();
        } catch (e) {
            reject(e);
        }
    });
}

// the global async wrapper
(async function () {
    const vocab = require('../tmp/iqa.vocab.json')
    const stopwords = await load_stopped_words()
    const answers_collection = await load_answers_collection()

    const files = {
        // './tmp/iqa.test.tokenlized': '../tmp/iqa.test.tokenlized.pair.json',
        // './tmp/iqa.valid.tokenlized': '../tmp/iqa.valid.tokenlized.pair.json',
        './tmp/iqa.train.tokenlized': '../tmp/iqa.train.ngram-corpus'
    }

    const file_keys = _.keys(files);
    for (let t in file_keys) {
        let file_path = file_keys[t];
        let target_path = files[file_path];
        console.log('in:', file_path);
        console.log('output:', target_path);
        // const iqa_tokenlized_data = await readlineq('./tmp/iqa.train.tokenlized')
        const iqa_tokenlized_data = await readlineq(file_path)
        for (let x in iqa_tokenlized_data) {
            let pair_data = []
            let [index, question, answers_raw, negtives_raw] = iqa_tokenlized_data[x].split('++$++')
            index = index.trim()
            debug('index', index, 'question', question)
            let question_ids = resolve_tokens(question.split(' '), stopwords)
            pair_data.push(question_ids.join(" "));
            let answers = parse_raw_string_to_json(answers_raw)
            // debug('index', index, 'answers', answers)
            for (let o in answers) {
                let answer_ids = resolve_tokens(answers_collection[answers[o]].split(' '), stopwords);
                debug('index', index, 'answer ids', JSON.stringify(answer_ids))
                pair_data.push(answer_ids.join(" "));
            }
            let negtives = parse_raw_string_to_json(negtives_raw)
            debug('index', index, 'negatives', negtives)
            for (let o in negtives) {
                let negtive_ids = resolve_tokens(answers_collection[negtives[o]].split(' '), stopwords);
                // debug('index', index, 'negtive ids', JSON.stringify(negtive_ids))
                pair_data.push(negtive_ids.join(" "));
            }
            await dump_lines_to_file(path.join(__dirname, target_path), pair_data);
        }
    }
})();