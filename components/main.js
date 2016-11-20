import React, { Component } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ListView,
  AsyncStorage,
  AppState
} from 'react-native'

import TimerMixin from 'react-timer-mixin';
const reactMixin = require('react-mixin');

import Button from 'react-native-button'
import Sound from 'react-native-sound'
import Drawer from 'react-native-drawer'

import SpeakingData from './../speaking.json'

import GoonData from './../goon.json'

//var SpeakingData = require('./../speaking.json')

const ONE_OR_A = '1 or A', A_PLUS_ONE = 'A + 1', ONE_PLUS_A = '1 + A'

const PLAY_MODES = [ ONE_OR_A, A_PLUS_ONE, ONE_PLUS_A]

const SCREEN_CONTINUE = 'screen continue'
const SCREEN_A_BTNS = 'screen A btns'
const SCREEN_PLAY_PAUSE_BTNS = 'screen play pause btns'

const STORAGE_KEY = 'chrsmnn_last_speaking_para';

  const initialState ={
    speakingLoaded: false,
    storageLoaded: false,
    playing: true,
    screenMode: SCREEN_A_BTNS,
    displayText: false,
    textPaneOpen: false,
    playMode: ONE_OR_A,
    players: [
      {
        paragraph: 0,
        playing: false,
        pan: 1,
        time: 0

      },
      {
        paragraph: 0,
        playing: false,
        pan: -1,
        time: 0

      }

    ]
  }


class MainView extends Component {




  constructor(props) {
    super(props)

    //this.scrolled = false;

    this.state = initialState;
    const speakingAudio = 'speaking.mp3'
    const goonAudio = 'goon.mp3'
    //console.log('file', file)

    this.sounds = []

    this.sounds[0] = new Sound(speakingAudio , Sound.MAIN_BUNDLE, (e) => {
      if (e) {
        console.log('error!!', e)
      } else {

        console.log('sound ready', this.sounds[0].getDuration())
      }
    });

    this.sounds[1] = new Sound(goonAudio, Sound.MAIN_BUNDLE, (e) => {
      if (e) {
        console.log('error!!', e)
      } else {

        console.log('sound ready', this.sounds[1].getDuration())
      }
    });



  }

  async _loadInitialState() {
    console.log('INITIAL STATE')
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEY);
      if (value !== null) {
        const storedParNum1 = JSON.parse(value).player1Paragraph
        const storedParNum2 = JSON.parse(value).player2Paragraph
        const playMode = JSON.parse(value).playMode
        console.log('Recovered selection from disk: ', storedParNum1, storedParNum2);

        this.setState({...this.state, storageLoaded: true, screenMode: SCREEN_CONTINUE})

        this.recoveredState = {...this.state,
          storageLoaded: true,
          screenMode: SCREEN_PLAY_PAUSE_BTNS,
          playMode: playMode,
          playing: true,
          players: [
           { ...this.state.players[0], paragraph: storedParNum1, play: true, pan: 1},
           { ...this.state.players[1], paragraph: storedParNum2, play: true, pan: -1}
        ]}

        console.log('recoveredState ', this.recoveredState)

        // this.setState({...this.state,
        //   storageLoaded: true,
        //   screenMode: SCREEN_CONTINUE,
        //   playMode: playMode,
        //   players: [
        //    { ...this.state.players[0], paragraph: storedParNum},
        //    { ...this.state.players[1]}
        // ]})

      }
      else {
        this.setState({...this.state, storageLoaded: true});
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({playMode: this.state.playMode, player1Paragraph:  0}))
      }
    } catch (error) {
      console.log('AsyncStorage error: ', error.message);
    }
  }
/*
  _setPlayerTimes() {
    const times = [this.speaking[1].time, this.speaking[2].time]
    console.log('TIMES ', times)
    this.setState({...this.state, players: [
       { ...this.state.players[0], time: times[0]},
       {...this.state.players[1], time: times[1]},

      ]})
  }
  */

  shouldComponentUpdate(nextProps, nextState) {
    //console.log('should update? ', nextState)
    // if(!nextState.storageLoaded || !nextState.speakingLoaded) {
    //   console.log('NO')
    //   return false
    // }

    return true;

  }

  componentDidMount() {

    AppState.addEventListener('change', this._handleAppStateChange);

    this._loadInitialState().done()
    this.speaking = SpeakingData.paragraphs.map(d => {
      const parts = d.time_min.split(':')
      const seconds = (+parts[0])*60 + (+parts[1])
      return {
        ...d,
        time: seconds

      }
    })
    this.goon = GoonData.paragraphs.map(d => {
      const parts = d.time_min.split(':')
      const seconds = (+parts[0])*60 + (+parts[1])
      return {
        ...d,
        time: seconds

      }
    })

    this.setState({...this.state, speakingLoaded: true});

    //this._setPlayerTimes()

    //console.log('SETTTING INTERVAL', TimerMixin.setTimeout)

   // this.timer = TimerMixin.setTimeout(() => {
   //    console.log('TIMER!!!! I do not leak!');
   //  }, 5000);

    this.timer = TimerMixin.setInterval(() => {
      if(this.speaking) {
        this.sounds.forEach((sound, i) => {
         //const i = 0
         //const sound = this.sounds[i]
          //console.log(i, this.state.players[i].paragraph)
          if(this.state.playing && this.state.players[i].playing)
            sound.getCurrentTime((seconds) => {
              //console.log(seconds, this.speaking[this.state.players[i].paragraph + 1].time)
              const textSegments = i===0 ? this.speaking : this.goon
              let newParaNum = this.state.players[i].paragraph+1
              let nextParStartTime = (textSegments[newParaNum] || {time: 0}).time
              const nextNextParStartTime = (textSegments[this.state.players[i].paragraph+2] || {time: 0}).time

              console.log('sound time', i, 'seconds', seconds, 'nextParStartTime', nextParStartTime)

              // also check against currentParStartTime to avoid track change fluctuations, getCurrentTime has lag
              if(seconds > nextParStartTime && seconds < nextNextParStartTime) {  //TODO when ends
                console.log('track change', i, this.state.players[i], seconds, nextParStartTime)
                if(i===0) {
                  console.log('prev and new par 0', i, newParaNum, this.state.players[i].paragraph)
                  if(this.state.playMode===ONE_PLUS_A) {
                    newParaNum =  Math.floor(Math.random() * textSegments.length)
                    nextParStartTime = (textSegments[newParaNum] || {time: 0}).time
                    this.sounds[0].setCurrentTime(nextParStartTime)
                  }
                  this.setState({...this.state, players: [
                     { ...this.state.players[0], paragraph: newParaNum, time: seconds}, //
                     { ...this.state.players[1]}
                  ]})

                  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({playMode: this.state.playMode,
                         player1Paragraph: newParaNum, player2Paragraph: this.state.players[1].paragraph}))


                }
                else {

                  if(this.state.playMode===A_PLUS_ONE) {
                    newParaNum =  Math.floor(Math.random() * textSegments.length)
                    nextParStartTime = (textSegments[newParaNum] || {time: 0}).time
                    this.sounds[1].setCurrentTime(nextParStartTime)
                  }
                  console.log('prev and new par 1', i, this.state.players[i].paragraph)
                  this.setState({...this.state, players: [
                     { ...this.state.players[0]}, //
                     { ...this.state.players[1], paragraph: newParaNum, time: seconds}
                  ]})
                  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({playMode: this.state.playMode,
                        player1Paragraph: this.state.players[0].paragraph, player2Paragraph:  newParaNum}))

                }
                /*
                this.setState({...this.state, players: [
                   { ...this.state.players[i], paragraph: this.state.players[i].paragraph+1}
                ]})
                */

              }

            })
        })
      }
      /*
      this.setState({...this.state, players: [
         { ...this.state.players[0], paragraph: this.state.players[0].paragraph+1},
         { ...this.state.players[1]}
      ]})
      */
    }, 2000)




  }

  componentWillUpdate(nextProps, nextState) {
    //check if a player is being changed to playing

    const { players, playing } = this.state
    const nextPlayers = nextState.players
    const nextPlaying = nextState.playing

    players.forEach((player, i) => {
      if(player.playing ===! nextPlayers[i].playing || playing!==nextPlaying) {
        console.log(`player ${i} mode changed to ${nextPlayers[i].playing}`)
        const sound = this.sounds[i]
        sound.getCurrentTime((seconds) => {
          const textSegments = i===0 ? this.speaking : this.goon
          const paraTime = textSegments[player.paragraph].time
          console.log('setting time? player ', i, ' paragraph ',  player.paragraph, ' seconds ', seconds, 'paraTime', paraTime)
          if(seconds < paraTime) {
            //player.time = paraTime  // needs setstate not allowed here. needed? should be set in setinterval
          }
          if(seconds<1) {  //TODO: this.speaking needed?  //TODO set anyways because when paused state.playing is false
            sound.setCurrentTime(nextPlayers[i].time) //needed for the first time
          }
          console.log('setting pan ', i, nextPlayers[i].pan)

          sound.setPan(nextPlayers[i].pan)

          if(nextPlaying && nextPlayers[i].playing) {
            console.log('playing ', i)
            sound.play()
          }
          else {
            console.log('pause ', i)
            sound.pause()
          }

        })
      }
    })





  }


  render() {

    console.log('state', this.state)

    if(!this.state.storageLoaded || !this.state.speakingLoaded) {
      return <View><Text>Loading</Text></View>
    }

    const { players, playing, screenMode, playMode} = this.state

    /*
    this.sounds.forEach((sound, i) => {
      const player = players[i]
      //console.log('parag time', i, player.paragraph, player.time)
      sound.getCurrentTime((seconds) => {
            //console.log(seconds, this.speaking[this.state.players[i].paragraph + 1].time)
            //const newParaNum = this.state.players[i].paragraph+1
            //const nextParStartTime = (this.speaking[newParaNum] || {time: 0}).time
            //if(seconds > nextParStartTime) {  //TODO when ends
        const textSegments = i===0 ? this.speaking : this.goon
        const paraTime = textSegments[player.paragraph].time
        console.log('player ', i, ' paragraph ',  player.paragraph, ' seconds ', seconds, 'paraTime', paraTime)
        if(seconds < paraTime) {
          player.time = paraTime
        }
        if(this.speaking && seconds<1) {  //TODO: this.speaking needed?
          //player.time = this.speaking[player.paragraph].time
          //console.log('SETTING TIME TO ',i , player.time)
          sound.setCurrentTime(player.time)
        }
      })
      sound.setPan(player.pan)
      if(playing && player.playing) {
        console.log('playing ', i)
        sound.play()
      }
      else {
        sound.pause()
      }
    })
    */


    /*
    const modeBtns = PLAY_MODES.map(d => {
      return (
          <Button style={{color: '#000' ,marginBottom: 30}} key={d}
            onPress={(e) => this._handlePress(d)}>
            {d}
          </Button>
        )
    })
    */

    const modeBtns = (
      <View style={{alignItems: 'center'}}>
        <Button onPress={(e) => this._handlePress(PLAY_MODES[0])}>
          <View style={{alignItems: 'center'}}>
            <Text style={styles.normaltext}>speaking is difficult</Text>
            <Text style={styles.normaltext}>or</Text>
            <Text style={styles.normaltext}>go on, make me</Text>
          </View>
        </Button>
        <Text style={styles.normaltext, styles.or}>or</Text>
        <Button  style={styles.normaltext} onPress={(e) => this._handlePress(PLAY_MODES[1])}>speaking is difficult / go on, make me</Button>
        <Text style={styles.normaltext, styles.or}>or</Text>
        <Button  style={styles.normaltext} onPress={(e) => this._handlePress(PLAY_MODES[2])}>go on, make me / speaking is difficult</Button>
      </View>
    )

    const btnColor = playing ? '#FF0000' : '#00FF00'
    const textBtn = <Button style={styles.normaltext} onPress={(e) => this.showText()}>text</Button>
    const playPauseBtns =  (
      <View style={{flexDirection:'row', alignSelf: 'stretch', padding: 15}}>
        <View style={{alignItems: 'flex-start', flex: 1 }}>
          <Button key="playpause"

                  onPress={(e) => this.playPause()}>
            <Text style={{backgroundColor: btnColor, width: 20, height: 20, borderRadius: 10 }} ></Text>
          </Button>
        </View>
        <View style={{width: 50}}>{textBtn}</View>
      </View>
    )

    const continueBtns = (
      <View>
        <Button key="continue"
                style={styles.normaltext}
                onPress={(e) => this.continuePlaying()}>
          resume
        </Button>
        <View style={{marginTop: 20}}/>
        <Button key="startover"
                style={styles.normaltext}
                onPress={(e) => this.startOverPlaying()}>
          start again
        </Button>
      </View>

    )
    let btns;
    switch(screenMode) {
      case SCREEN_A_BTNS:
        btns = modeBtns;
        break;
      case SCREEN_PLAY_PAUSE_BTNS:
        btns = playPauseBtns;
        break;
      case SCREEN_CONTINUE:
        btns = continueBtns;
        break;
      default:
        btns = <View/>
        break;
     //= screenMode===SCREEN_A_BTNS ? modeBtns : playPauseBtns
    }
    console.log('player 0 paragraph', players[0].paragraph, 'player 0 paragraph', players[1].paragraph)
    if(this.speaking) {

      //console.log(this.speaking[players[0].paragraph], this.speaking[players[0].paragraph].text)

    }
    /*
    const paragraphsUptoNow = this.speaking ? this.speaking.reduce((prev, cur, i) => {
      console.log(i, players[0].paragraph)
      const content =
      return i <= players[0].paragraph ? <Text key={i}>cur.text</Text> : prev
    }, '') : ''
    */
    const textSegments = playMode===ONE_PLUS_A ? this.goon : this.speaking
    const mainPlayerIndex = playMode===ONE_PLUS_A ? 1: 0


    console.log('mainplayer paragraph', playMode, mainPlayerIndex, players[mainPlayerIndex].paragraph)

    const paragraphsUptoNow = textSegments ? textSegments.map((cur, i) => {

      const textEl = (i <= players[mainPlayerIndex].paragraph) ?
        <Text ref={`para-${i}`} style={{padding: 20, textAlign: 'left', color: '#333'}}>{cur.text}</Text> :
        <Text ref={`para-${i}`} style={{height: 0}}></Text>


      // const textEl = (i <= players[0].paragraph) ?
      //   <Text ref={`para-${i}`} style={{padding: 20, textAlign: 'right', color: '#333'}}>{cur.text}</Text> :
      //   <Text ref={`para-${i}`} style={{height: 0}}></Text>

      return <View key={`para-${i}`}>{textEl}</View>

    }) : ''



    const otherTextSegments = playMode===ONE_PLUS_A ? this.speaking : this.goon
    const otherPlayer = playMode===ONE_PLUS_A ? 0: 1

    //console.log(otherPlayer, this.state.players[otherPlayer], otherTextSegments, otherTextSegments[this.state.players[otherPlayer].paragraph])
    const currentRandomParagraph = otherTextSegments[this.state.players[otherPlayer].paragraph].text
    //console.log('currentRandomParagraph', currentRandomParagraph)
    const rightParagraph = playMode!==ONE_OR_A ?
      <Text ref='para-n' key='para-n' style={{padding: 20, textAlign: 'right', color: '#333'}}>{currentRandomParagraph}</Text> :
      <Text></Text>


    const text = (
      <ScrollView ref="textscroll" onContentSizeChange={(contentWidth, contentHeight)=>{ this.scrollContentSizeChanged(contentWidth, contentHeight)}}>
        <View>{this.speaking ? paragraphsUptoNow : null}</View><View>{rightParagraph}</View>
      </ScrollView>
    )
    //console.log(text)
    /*
    if(this.speaking) {
       const lastParagraph = this.refs[`para-${players[0].paragraph}`]
       console.log(this.refs, `para-${players[0].paragraph}`,  lastParagraph)
      if(lastParagraph)
      lastParagraph.measure( (fx, fy, width, height, px, py) => {
        console.log(py)
        this.refs.textscroll.scrollTo({y: py, animated:true})
      })
    }
    */


    return (
      <Drawer
        type="displace"
        content={text}
        ref="textdrawer"
        styles={{drawer: { padding: 0}}}
        tapToClose={true}
        captureGestures={true}
        acceptPan={true}
        negotiatePan={true}
        acceptDoubleTap={true}
        panCloseMask={0.3}
        side='right'
        tweenHandler={(ratio) => ({
          main: { opacity:(2-ratio)/2 }
        })}
        >
          <View style={styles.headphones}>
            <Text style={{ color: '#000'}}>for headphones</Text>
          </View>
          <View style={styles.container}>
            <View style={{alignSelf: 'stretch',}}>
              {btns}
            </View>
          </View>
        <Button  onPress={(e) => this.clearStorage()}>Delete storage</Button>
      </Drawer>
    )
  }


  clearStorage() {
    AsyncStorage.clear()
  }

  scrollContentSizeChanged(contentWidth, contentHeight) {
      const scorllHeight = 0
      if(this.refs.textscroll)
      {
        this.refs.textscroll.scrollTo({y: contentHeight - scorllHeight , animated:true});
      }

  }

  componentDidUpdate(prevPrps, prevState) {
    /*
    console.log('COMPONENT DID UPDATE')
    const { players } = this.state
    const  prevPlayers  = prevState.players

    if(this.scrolled && players[0].paragraph === prevPlayers[0].paragraph && players[1].paragraph === prevPlayers[1].paragraph) {
      return;
    }
    console.log('SCROLLING')

    this.scrolled = true;

    if(this.speaking) {
       const lastParagraph = this.refs[`para-${players[0].paragraph}`]
       console.log(this.refs, `para-${players[0].paragraph}`,  lastParagraph)
      if(lastParagraph)
      lastParagraph.measure( (fx, fy, width, height, px, py) => {
        console.log(py)
        this.refs.textscroll.scrollTo({y: py, animated:true})
      })
    }
    */

  }

  showText() {
    console.log('SHOW TEXT')
    this.refs.textdrawer.open()
  }

  _handlePress(mode) {
        console.log('Pressed!!!!', mode)
        this.playSound(mode)
  }

  playPause() {
    this.setState({...this.state, playing: !this.state.playing})
  }



  continuePlaying() {
   /*
   this.setState({...this.state,
      screenMode: SCREEN_PLAY_PAUSE_BTNS,
      players: [
       { ...this.state.players[0], playing: true},
       { ...this.state.players[1]}
    ]})
    */
    console.log('recoveredState', this.recoveredState)
    this.setState(this.recoveredState)

    //this.playSound(this.state.playMode)
  }

  startOverPlaying() {
    //this.setState({...this.state, screenMode: SCREEN_A_BTNS, players})

    this.setState({...this.state, screenMode: SCREEN_A_BTNS})

  }

  playSound(mode) {

    const {players} = this.state
    let rand

    switch(mode) {
      case ONE_OR_A:
        this.setState({
          ...this.state,
          screenMode: SCREEN_PLAY_PAUSE_BTNS,
          playMode: mode,
          players: [
            {
              playing: true,
              pan: 0,
              time: this.speaking[this.state.players[0].paragraph].time,
              paragraph: this.state.players[0].paragraph
            },
            {
              playing: false,
              pan: 0,
              time: 0,
              paragraph: this.state.players[1].paragraph

            }
          ]
        })
        break;
      case A_PLUS_ONE:
        //if A+1, then A plays straight through on left channel and the paras of 1 are randomised and played on right.
        rand = Math.floor(Math.random() * this.goon.length)
        this.setState({
          ...this.state,
          screenMode: SCREEN_PLAY_PAUSE_BTNS,
          playMode: mode,
          players: [
            {
              playing: true,
              pan: 1,
              time: this.speaking[this.state.players[0].paragraph].time,
              paragraph: this.state.players[0].paragraph

            },
            {
              playing: true,
              pan: -1,
              time: this.goon[rand].time,
              paragraph: rand

            }
          ]
        })
        break;
      case ONE_PLUS_A:
        //if 1+A, then 1 plays L and A is randomised on R
        rand = Math.floor(Math.random() * this.speaking.length)
        this.setState({
          ...this.state,
          screenMode: SCREEN_PLAY_PAUSE_BTNS,
          playMode: mode,
          players: [
            {
              playing: true,
              pan: -1,
              time: this.speaking[rand].time,
              paragraph: rand

            },
            {
              playing: true,
              pan: 1,
              time: this.goon[this.state.players[1].paragraph].time,
              paragraph: this.state.players[1].paragraph

            }
          ]
        })
        break;
    }


  }

  componentWillUnmount() {

    //TimerMixin.clearTimeout(this.timer);
    this.cleanup()
  }

  _handleAppStateChange(state) {
    console.log('state changed', state)
    if (state === 'inactive') {
      this.cleanup()
    }
  }

  cleanup() {
    TimerMixin.clearInterval(this.timer);

    console.log('cleaning up')
    this.sounds[0].stop()
    this.sounds[1].stop()

    this.sounds[0].release()
    this.sounds[1].release()

  }

}


const styles = StyleSheet.create({
  headphones: {
    alignItems: 'center',
    padding: 10,


  },
  or: {
    paddingTop: 8,
    paddingBottom: 8,
    fontWeight: 'normal',
    fontSize: 14,
    color: '#000'
  },
  normaltext: {
    fontWeight: 'normal',
    fontSize: 14,
    color: '#000'
  },
  /*
  btnsrow: {
    flexDirection:'row',
    flex: 1,
    justifyContent: 'flex-end'

  },
  */
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
})

//reactMixin(MainView.prototype, TimerMixin);

export default MainView