import React, { Component } from 'react'
import {
  StyleSheet,
  Text,
  View
} from 'react-native'


import Button from 'react-native-button'
import Sound from 'react-native-sound'

import SpeakingData from './../speaking.json'
//var SpeakingData = require('./../speaking.json')

const ONE_OR_A = '1 or A', A_PLUS_ONE = 'A + 1', ONE_PLUS_A = '1 + A'

const PLAY_MODES = [ ONE_OR_A, A_PLUS_ONE, ONE_PLUS_A]

const SCREEN_A_BTNS = 'screen A btns'
const SCREEN_PLAY_PAUSE_BTNS = 'screen play pause btns'
const SCREEN_TEXT = 'screen text'


class MainView extends Component {

  constructor(props) {
    super(props)

    this.state = {
      playing: true,
      screenMode: SCREEN_A_BTNS,
      displayText: false,
      lastParagraph: 10,
      players: [
        {
          playing: false,
          pan: 1,
          time: 0

        },
        {
          playing: false,
          pan: -1,
          time: 0

        }

      ]
    }

    const file = 'speaking.mp3'
    console.log('file', file)

    this.sounds = []
    
    this.sounds[0] = new Sound(file , Sound.MAIN_BUNDLE, (e) => {
      if (e) {
        console.log('error!!', e)
      } else {

        console.log('sound ready', this.sounds[0].getDuration())
      }
    });

    this.sounds[1] = new Sound(file , Sound.MAIN_BUNDLE, (e) => {
      if (e) {
        console.log('error!!', e)
      } else {

        console.log('sound ready', this.sounds[1].getDuration())
      }
    });


  }

  componentDidMount() {
    console.log('SpeakingData', SpeakingData)
    this.speaking = SpeakingData.paragraphs.map(d => {
      const parts = d.time_min.split(':')
      const seconds = (+parts[0])*60 + (+parts[1])
      return {
        ...d,
        time: seconds

      }
    })
    const times = [this.speaking[1].time, this.speaking[2].time]
    this.setState({...this.state, players: [
       { ...this.state.players[0], time: times[0]},
       {...this.state.players[1], time: times[1]},

      ]})
  }

  
  render() {

    console.log('state', this.state)

    const {lastParagraph, players, playing, screenMode} = this.state


    this.sounds.forEach((sound, i) => {
      const player = players[i]
      console.log(i, player)
      sound.setCurrentTime(player.time)
      sound.setPan(player.pan)
      if(playing && player.playing) {
        sound.play()
      }
      else {
        sound.stop()
      }
    })  


    
    const modeBtns = PLAY_MODES.map(d => {
      return (
          <Button style={{color: '#000' ,marginBottom: 30}} key={d}
            onPress={(e) => this._handlePress(d)}>
            {d}
          </Button>
        )
    })

    const btnColor = playing ? '#FF0000' : '#00FF00'
    const playPauseBtns =  (
      <View>
        <Button key="playpause" style={{backgroundColor: btnColor , width: 10, height: 10, borderRadius: 5 }}  onPress={(e) => this.playPause()}>
          <Text style={{backgroundColor: btnColor, width: 10, height: 10, borderRadius: 5 }} ></Text>
        </Button>
        <Button onPress={(e) => this.showText()}>Text?</Button>
      </View>
    )
    const btns = screenMode===SCREEN_PLAY_PAUSE_BTNS ? playPauseBtns : modeBtns
    console.log(this.speaking ? this.speaking[0].text : '')
    const content = screenMode!==SCREEN_TEXT ? btns : (<Text>{this.speaking ? this.speaking[0].text : ''}</Text>)
    
    

    return (
      <View style={styles.container}>
        
        {content}
        
        
        
  
      </View>
    )
  }

  showText() {
    this.setState({...this.state, screenMode: SCREEN_TEXT})
  }

  _handlePress(mode) {
        console.log('Pressed!!!!', mode)
        console.log(SpeakingData)
        this.playSound(mode)
  }

  playPause() {
    this.setState({...this.state, playing: !this.state.playing})
  }

  playSound(mode) {

    const {lastParagraph, players} = this.state
    let rand

    switch(mode) {
      case ONE_OR_A:
        this.setState({
          ...this.state,
          screenMode: SCREEN_PLAY_PAUSE_BTNS,
          players: [
            {
              playing: true,
              pan: 0,
              time: this.speaking[lastParagraph].time

            },
            {
              playing: false,
              pan: 0,
              time: 0

            }
          ]
        })
        break;
      case ONE_PLUS_A:
        rand = Math.floor(Math.random() * this.speaking.length)
        this.setState({
          ...this.state,
          screenMode: SCREEN_PLAY_PAUSE_BTNS,
          players: [
            {
              playing: true,
              pan: -1,
              time: this.speaking[lastParagraph].time

            },
            {
              playing: true,
              pan: 1,
              time: this.speaking[rand].time

            }
          ]
        })
        break;
      case A_PLUS_ONE:
        rand = Math.floor(Math.random() * this.speaking.length)
        this.setState({
          ...this.state,
          screenMode: SCREEN_PLAY_PAUSE_BTNS,
          players: [
            {
              playing: true,
              pan: -1,
              time: this.speaking[lastParagraph].time

            },
            {
              playing: true,
              pan: 1,
              time: this.speaking[rand].time

            }
          ]
        })
        break;
    }


  }

  componentWillUnmount() {
    console.log('unmounting')
    this.sounds[0].stop()
    this.sounds[1].stop()
  }

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
})

export default MainView