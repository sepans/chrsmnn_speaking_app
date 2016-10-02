import React, { Component } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ListView
} from 'react-native'

import TimerMixin from 'react-timer-mixin';
const reactMixin = require('react-mixin');

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

    this.scrolled = false;

    this.state = {
      playing: true,
      screenMode: SCREEN_A_BTNS,
      displayText: false,
      players: [
        {
          paragraph: 8,
          playing: false,
          pan: 1,
          time: 0

        },
        {
          paragraph: 8,
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

    console.log('SETTTING INTERVAL', TimerMixin.setTimeout)

   // this.timer = TimerMixin.setTimeout(() => {
   //    console.log('TIMER!!!! I do not leak!');
   //  }, 5000);
    /*
    this.timer = TimerMixin.setInterval(() => {
      console.log('CHANGING PARAGRAPH')
      this.setState({...this.state, players: [
         { ...this.state.players[0], paragraph: this.state.players[0].paragraph+1},
         { ...this.state.players[1]}
      ]})
    }, 5000)
    */
    


  }

  
  render() {

    console.log('state', this.state)

    const { players, playing, screenMode} = this.state


    this.sounds.forEach((sound, i) => {
      const player = players[i]
      console.log(i, player)
      sound.setCurrentTime(player.time)
      sound.setPan(player.pan)
      if(playing && player.playing) {
        console.log('playing ',i)
        //sound.play()
      }
      else {
        //sound.stop()
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
    const textBtn = screenMode!==SCREEN_TEXT ? <Button onPress={(e) => this.showText()}>Text?</Button> : <View/>
    console.log('textbtn', screenMode, textBtn)
    const playPauseBtns =  (
      <View>
        <Button key="playpause" style={{backgroundColor: btnColor , width: 10, height: 10, borderRadius: 5 }}  onPress={(e) => this.playPause()}>
          <Text style={{backgroundColor: btnColor, width: 10, height: 10, borderRadius: 5 }} ></Text>
        </Button>
       <View>{textBtn}</View>
      </View>
    )
    const btns = screenMode===SCREEN_A_BTNS ? modeBtns : playPauseBtns
    console.log(players[0].paragraph)
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
    const paragraphsUptoNow = this.speaking ? this.speaking.map((cur, i) => {
      //console.log(i, players[0].paragraph)
      const textEl = (i <= players[0].paragraph) ? <Text ref={`para-${i}`} style={{padding: 5}}>{cur.text}</Text> : <Text ref={`para-${i}`}></Text>
      return <View key={`para-${i}`}>{textEl}</View>
      
    }) : ''


    //console.log('paragraphsUptoNow', paragraphsUptoNow)
    const text = <View style={{opacity: screenMode===SCREEN_TEXT ? 1 : 0}}>{this.speaking ? paragraphsUptoNow : null}</View>
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
      <View style={styles.container}>
        <View>
          {btns}
        </View>
        <ScrollView ref="textscroll" onContentSizeChange={(contentWidth, contentHeight)=>{ this.scrollContentSizeChanged(contentWidth, contentHeight)}}>
        {text}
        </ScrollView>
      </View>
    )
  }

  scrollContentSizeChanged(contentWidth, contentHeight) {
      if(this.refs.textscroll)
      {
       this.refs.textscroll.scrollTo({y: contentHeight, animated:true});
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

    const {players} = this.state
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
      case ONE_PLUS_A:
        rand = Math.floor(Math.random() * this.speaking.length)
        this.setState({
          ...this.state,
          screenMode: SCREEN_PLAY_PAUSE_BTNS,
          players: [
            {
              playing: true,
              pan: -1,
              time: this.speaking[this.state.players[0].paragraph].time,
              paragraph: this.state.players[0].paragraph

            },
            {
              playing: true,
              pan: 1,
              time: this.speaking[rand].time,
              paragraph: rand

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
              time: this.speaking[this.state.players[0].paragraph].time,
              paragraph: this.state.players[0].paragraph

            },
            {
              playing: true,
              pan: 1,
              time: this.speaking[rand].time,
              paragraph: rand

            }
          ]
        })
        break;
    }


  }

  componentWillUnmount() {

  //TimerMixin.clearTimeout(this.timer);
  TimerMixin.clearInterval(this.timer);

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

//reactMixin(MainView.prototype, TimerMixin);

export default MainView