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


import Button from 'react-native-button'
import Sound from 'react-native-sound'
import Drawer from 'react-native-drawer'

import SpeakingData from './../speaking.json'

import GoonData from './../goon.json'

const GOON = 'GOON', SPEAKING = 'SPEAKING', SPEAKING_PLUS_GOON = 'SPEAKING_PLUS_GOON', GOON_PLUS_SPEAKING = 'GOON_PLUS_SPEAKING'

const PLAY_MODES = [ SPEAKING, GOON, SPEAKING_PLUS_GOON, GOON_PLUS_SPEAKING]

const SCREEN_CONTINUE = 'screen continue'
const SCREEN_A_BTNS = 'screen A btns'
const SCREEN_PLAY_PAUSE_BTNS = 'screen play pause btns'

const CHANNEL_BOTH = 'CHANNEL_BOTH', CHANNEL_LEFT = 'CHANNEL_LEFT', CHANNEL_RIGHT = 'CHANNEL_RIGHT'

const STORAGE_KEY = 'chrsmnn_last_speaking_para';

  const initialState ={
    speakingLoaded: false,
    storageLoaded: false,
    playing: true,
    screenMode: SCREEN_A_BTNS,
    displayText: false,
    textPaneOpen: false,
    playMode: GOON,
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

    ],
    playedParagraphs: []
  }


class MainView extends Component {


  constructor(props) {
    super(props)


    this.state = initialState;

    this.sounds = []
    this.soundParagraphs = [-1, -1]
    this.timer = []

  }

  async _loadInitialState() {
    console.log('INITIAL STATE')
    let value
    try {
       value = await AsyncStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.log('AsyncStorage error: ', error.message);
      return;
    }

    if (value !== null) {
      const storedParNum1 = JSON.parse(value).player1Paragraph
      const storedParNum2 = JSON.parse(value).player2Paragraph
      const playMode = JSON.parse(value).playMode
      const playedParagraphs = JSON.parse(value).playedParagraphs || []
      console.log('Recovered selection from disk: ', JSON.parse(value), storedParNum1, storedParNum2);

      this.setState({...this.state, storageLoaded: true, screenMode: SCREEN_CONTINUE})

      this.recoveredState = {...this.state,
        storageLoaded: true,
        screenMode: SCREEN_PLAY_PAUSE_BTNS,
        playMode: playMode,
        playing: true,
        players: [
          { ...this.state.players[0],
            paragraph: storedParNum1,
            playing: true,
            time: this.speaking[storedParNum1] ? this.speaking[storedParNum1].time : 0, //TODO fix time
            pan: playMode===SPEAKING_PLUS_GOON ? 1 : -1
          },
          { ...this.state.players[1],
            paragraph: storedParNum2,
            playing: true,
            time: this.goon[storedParNum2] ? this.goon[storedParNum2].time : 0, //TODO fix time
            pan: playMode===SPEAKING_PLUS_GOON ? -1 : 1
          }
        ],
        playedParagraphs: playedParagraphs
      }

      console.log('recoveredState ', this.recoveredState)


    }
    else {
      this.setState({...this.state, storageLoaded: true});
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({playMode: this.state.playMode,
         player1Paragraph:  0, player2Paragraph:  0, playedParagraphs: []}))
    }
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



  }

  componentWillUpdate(nextProps, nextState) {
    //check if a player is being changed to playing

    const { players, playing } = this.state
    const nextPlayers = nextState.players
    const nextPlaying = nextState.playing

    console.log('playing? ', playing, nextPlaying)

    players.forEach((player, i) => {
      //console.log(`player ${i} mode was ${player.playing} now ${nextPlayers[i].playing}`)
      //if(player.playing ===! nextPlayers[i].playing || playing!==nextPlaying) {
        console.log(`player ${i} mode changed to ${nextPlayers[i].playing}`)
        //sound.getCurrentTime((seconds) => {
          const textSegments = i===0 ? this.speaking : this.goon
          const paraTime = textSegments[nextPlayers[i].paragraph].time
          console.log('setting time? player ', i, ' paragraph ',  player.paragraph,
                     'paraTime', paraTime, 'this.soundParagraphs[i]', this.soundParagraphs[i])
          //if(seconds < paraTime) {
            //player.time = paraTime  // needs setstate not allowed here. needed? should be set in setinterval
          //}
          if(this.soundParagraphs[i]!==nextPlayers[i].paragraph) {  //TODO: this.speaking needed?  //TODO set anyways because when paused state.playing is false
            //sound.setCurrentTime(paraTime) //needed for the first time

            this.soundParagraphs[i] = nextPlayers[i].paragraph

            const filePrefix = i===0 ? 'speaking_' : 'goon_'

            //console.log('releasing prev sound')
            //if(this.sounds[i])  {
              //this.sounds[i].release()
            //}

            this.sounds[i] = new Sound(filePrefix + this.soundParagraphs[i] , Sound.MAIN_BUNDLE, (e) => {
              if (e) {
                console.log('error!!', e)
              } else {

                const sound = this.sounds[i]


                console.log('sound ready', this.sounds[i].getDuration())

                this.playPauseSound(i, sound, nextPlayers[i], nextPlaying)

            }



          });


        }
        else {

          const sound = this.sounds[i]

          console.log('already loaded, playing... ', i)

          if(player.playing ===! nextPlayers[i].playing || playing!==nextPlaying) {

            this.playPauseSound(i, sound, nextPlayers[i], nextPlaying)
          }

        }

    })

  }

  playPauseSound(i, sound, player, playing) {
    if(playing && player.playing) {

      console.log('setting pan ', i, player.pan)

      sound.setPan(player.pan)

      console.log('playing ', i)

      sound.play((success) => {
        if(success) {
          console.log('finished playing', i)

          sound.release()

          this.timeIsUp(i)

        }
        else {

          console.log('ERROR!!!!  playing ', i)
          //schedule new track
          this.timeIsUp(i)
        }
      })
    }
    else {
      console.log('pause ', i)
      sound.pause()

    }
  }


  render() {

    console.log('------ RENDER, state', this.state)

    if(!this.state.storageLoaded || !this.state.speakingLoaded) {
      return <View><Text>Loading</Text></View>
    }

    const { players, playing, screenMode, playMode, playedParagraphs} = this.state


    const modeBtns = (
      <View style={{alignItems: 'center'}}>
        <Button  style={styles.normaltext} onPress={(e) => this._handleModePlayPressed(PLAY_MODES[0])}>speaking is difficult</Button>
        <Text style={styles.normaltext, styles.or}>or</Text>
        <Button  style={styles.normaltext} onPress={(e) => this._handleModePlayPressed(PLAY_MODES[1])}>go on, make me</Button>
        <Text style={styles.normaltext, styles.or}>or</Text>
        <Button  style={styles.normaltext} onPress={(e) => this._handleModePlayPressed(PLAY_MODES[2])}>speaking is difficult / go on, make me</Button>
        <Text style={styles.normaltext, styles.or}>or</Text>
        <Button  style={styles.normaltext} onPress={(e) => this._handleModePlayPressed(PLAY_MODES[3])}>go on, make me / speaking is difficult</Button>
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


    const paragraphsUptoNow = playedParagraphs.map((par, i) => {
      //{text: SPEAKING, num: newPragraphNum, channel: CHANNEL_RIGHT}
      const textSegments = par.text===GOON ? this.goon : this.speaking
      const paragraphText = textSegments[par.num].text
      const textAlign = par.channel===CHANNEL_RIGHT ? 'right' : 'left'
      console.log(par, textAlign)
      return <Text key={`para-${par.text}-${par.num}`} ref={`para-${par.text}-${par.num}`} style={{padding: 20, textAlign: textAlign, color: '#333'}}>{paragraphText}</Text>
    })



    const text = (
      <ScrollView ref="textscroll" onContentSizeChange={(contentWidth, contentHeight)=>{ this.scrollContentSizeChanged(contentWidth, contentHeight)}}>
        <View>{paragraphsUptoNow}</View>
      </ScrollView>
    )

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

  showText() {
    console.log('SHOW TEXT')
    this.refs.textdrawer.open()
  }

  _handleModePlayPressed(mode) {
        console.log('Pressed!!!!', mode)
        this.playSound(mode)
  }

  playPause() {
    this.setState({...this.state, playing: !this.state.playing})
  }

  continuePlaying() {

    console.log('recoveredState', this.recoveredState)
    this.setState(this.recoveredState)
  }

  startOverPlaying() {

    this.setState({...this.state, screenMode: SCREEN_A_BTNS})

  }




  timeIsUp(i) {

    const { playMode, playedParagraphs } = this.state

    const textSegments = i===0 ? this.speaking : this.goon

    console.log(' ----- Time is up for ', i)
    if(!this.state.players[i].playing || !this.state.playing) {
      return
    }

    if (i===0 && playMode===GOON_PLUS_SPEAKING) {


      const newPragraphNum = Math.floor(Math.random() * textSegments.length)
      const newTime = textSegments[newPragraphNum].time

      console.log('randomizing ', i, ' to ', newPragraphNum)

      playedParagraphs.push({text: SPEAKING, num: newPragraphNum, channel: CHANNEL_RIGHT})

      this.setState({...this.state, players: [
               { ...this.state.players[0], paragraph: newPragraphNum, time: newTime}, //
               { ...this.state.players[1]}
        ],
        playedParagraphs: playedParagraphs
      })


      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({playMode: this.state.playMode,
             player1Paragraph: newPragraphNum, player2Paragraph: this.state.players[1].paragraph,
             playedParagraphs: playedParagraphs
           }))



    }
    else if (i===1 && playMode===SPEAKING_PLUS_GOON) {

      const newPragraphNum = Math.floor(Math.random() * textSegments.length)
      const newTime = textSegments[newPragraphNum].time

      console.log('randomizing ', i, ' to ', newPragraphNum)

      playedParagraphs.push({text: GOON, num: newPragraphNum, channel: CHANNEL_RIGHT})

      this.setState({...this.state, players: [
               { ...this.state.players[0]}, //
               { ...this.state.players[1], paragraph: newPragraphNum, time: newTime}
        ],
        playedParagraphs: playedParagraphs
      })

      //this.sounds[i].setCurrentTime(newTime)


      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({playMode: this.state.playMode,
             player1Paragraph: this.state.players[0].paragraph, player2Paragraph: newPragraphNum,
             playedParagraphs: playedParagraphs
           }))


    }
    else if (i===0) {
      //TODO if player.paragraph + 1 > thisSegments.length
      const newPragraphNum = this.state.players[i].paragraph + 1
      const newTime = textSegments[newPragraphNum].time

      console.log('continue ', i, ' with ', newPragraphNum)

      playedParagraphs.push({text: SPEAKING, num: newPragraphNum, channel: CHANNEL_LEFT}) // or both, does it matter?

      this.setState({...this.state, players: [
               { ...this.state.players[0], paragraph: newPragraphNum, time: newTime}, //
               { ...this.state.players[1]}
        ],
        playedParagraphs: playedParagraphs
      })


      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({playMode: this.state.playMode,
             player1Paragraph: newPragraphNum, player2Paragraph: this.state.players[1].paragraph,
             playedParagraphs: playedParagraphs
           }))

    }
    else if (i===1) {

      const newPragraphNum = this.state.players[i].paragraph + 1
      const newTime = textSegments[newPragraphNum].time

      console.log('continue ', i, ' with ', newPragraphNum)

      playedParagraphs.push({text: GOON, num: newPragraphNum, channel: CHANNEL_LEFT}) // or both, does it matter?

      this.setState({...this.state, players: [
               { ...this.state.players[0]}, //
               { ...this.state.players[1], paragraph: newPragraphNum, time: newTime}
        ],
        playedParagraphs: playedParagraphs
      })

      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({playMode: this.state.playMode,
             player1Paragraph: this.state.players[0].paragraph, player2Paragraph: newPragraphNum,
             playedParagraphs: playedParagraphs
           }))

    }

  }

  playSound(mode) {

    const { players } = this.state
    let rand

    switch(mode) {
      case SPEAKING:
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
          ],
          playedParagraphs: [{text: SPEAKING, num: 0, channel: CHANNEL_BOTH}]
        })

        break;
      case GOON:
        this.setState({
          ...this.state,
          screenMode: SCREEN_PLAY_PAUSE_BTNS,
          playMode: mode,
          players: [
            {
              playing: false,
              pan: 0,
              time: 0,
              paragraph: this.state.players[0].paragraph
            },
            {
              playing: true,
              pan: 0,
              time: this.goon[this.state.players[0].paragraph].time,
              paragraph: this.state.players[1].paragraph

            }
          ],
          playedParagraphs: [{text: GOON, num: 0, channel: CHANNEL_BOTH}]
        })
        break;
      case SPEAKING_PLUS_GOON:
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
              time: 0,
              paragraph: 0

            },
            {
              playing: true,
              pan: -1,
              time: this.goon[rand].time,
              paragraph: rand

            }
          ],
          playedParagraphs: [{text: SPEAKING, num: 0, channel: CHANNEL_LEFT},
                             {text: GOON, num: rand, channel: CHANNEL_RIGHT}]
        })
        break;
      case GOON_PLUS_SPEAKING:
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
          ],
          playedParagraphs: [{text: GOON, num: 0, channel: CHANNEL_LEFT},
                             {text: SPEAKING, num: rand, channel: CHANNEL_RIGHT}]
        })
        break;
    }

  }

  componentWillUnmount() {

    this.cleanup()
  }

  _handleAppStateChange(state) {
    console.log('state changed', state)
    if (state === 'inactive') {
      this.cleanup()
    }
  }

  cleanup() {

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


export default MainView