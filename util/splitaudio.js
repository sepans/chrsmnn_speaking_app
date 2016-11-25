
'use strict';


const fs = require('fs')

const spawn = require( 'child_process' ).spawn

const audioPath = '../android/app/src/main/res/raw/'
const srcAudioPath = '../../'
const trackName = 'goon'
const audioFile = srcAudioPath + trackName + '.mp3'
const audioEndTime = 6047.736 // 6047.736 for speaking 4150.56 for goon
const jsonFile = `../${trackName}.json`
const jsonRaw = fs.readFileSync(jsonFile, 'utf8')

const json = JSON.parse(jsonRaw)
const {paragraphs} = json

paragraphs.forEach((paragraph, i) => {
	const endPadding = 3
	const startTime = paragraph.time_min
	const endTime = i!==paragraphs.length-1 ? paragraphs[i+1].time_min : audioEndTime
	const startTimeSeconds = parseInt(startTime.split(':')[0])* 60 + parseInt(startTime.split(':')[1])
	const endTimeSeconds = i!==paragraphs.length-1 ? parseInt(endTime.split(':')[0]* 60) + parseInt(endTime.split(':')[1]) -3  : audioEndTime
	const ffmpegCommand = `ffmpeg -ss ${startTimeSeconds} -t ${endTimeSeconds-startTimeSeconds} -i ${audioFile} ${audioPath}/${trackName}_${i}.mp3`
	const ffmpegCommandArgs = ffmpegCommand.split(' ')
	ffmpegCommandArgs.splice(0, 1)

    //if(i===0) {
	console.log(ffmpegCommand)
	//console.log(ffmpegCommandArgs)
    const ffmpeg = spawn('ffmpeg', ffmpegCommandArgs);


    ffmpeg.stdout.on( 'data', data => {
	    console.log( `stdout: ${data}` );
	});

	ffmpeg.stderr.on( 'data', data => {
	    console.log( `stderr: ${data}` );
	});

	ffmpeg.on( 'close', code => {
	    console.log( `child process exited with code ${code}` );
	});


    //}
})
