#! /bin/bash 
###########################################
# remove duplicated lines
# https://unix.stackexchange.com/questions/30173/how-to-remove-duplicate-lines-inside-a-text-file
###########################################

# constants
baseDir=$(cd `dirname "$0"`;pwd)
# functions
function dedup(){
    echo $1 "pre lines:" `cat $1|wc -l`
    DFILE=$1.dedup
    mv $1 $DFILE
    awk '!seen[$0]++' $DFILE > $1
    rm $DFILE
    echo $1 "post lines:" `cat $1|wc -l`
}

# main 
[ -z "${BASH_SOURCE[0]}" -o "${BASH_SOURCE[0]}" = "$0" ] || return
cd $baseDir/..
dedup tmp/iqa.train.ngram-corpus
dedup tmp/iqa.test.ngram-corpus
dedup tmp/iqa.valid.ngram-corpus
