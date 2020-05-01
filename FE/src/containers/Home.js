import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux'
import { Link } from 'react-router-dom';
import * as roomActions from 'actions/room';
import history from 'utils/history';
import wsAction from 'utils/wsAction';
import Header from 'containers/Header';
import { getPersonName } from 'utils/main';

@connect(
    state => ({
        roomList: state.room.roomList
    }),
    dispatch => bindActionCreators({...roomActions}, dispatch)
)
export default class Home extends Component {
    state = {
        roomInputValue: ''
    };
    render () {
        const { roomList } = this.props;
        return (
            <section>
                <Header title="Home Page" type={'home'}/>
                <section className="home-container">
                    <section className="input-wrapper input-group input-btn">
                        <input
                            className="input input-default input-lg"
                            placeholder="Enter the Room Name"
                            value={this.state.roomInputValue}
                            onChange={
                                e => {
                                    let roomInputValue = e.target.value;
                                    this.setState({
                                        roomInputValue
                                    });
                                }
                            }
                            onKeyDown={ e => {
                                if (e.keyCode === 13) {
                                    this.enterRoom();
                                }
                            }}
                        />
                        <span className={"btn btn-default btn-lg" + (this.state.roomInputValue ? '' : ' disabled')} onClick={::this.enterRoom}>Join Room</span>
                    </section>
                    
                    <section className="input-wrapper">
                        <small className="rule_tip">if the room name is not exist, a new room with the same name will be created for u!</small>
                    </section>
                    <section className="room-list-wrapper">
                        {
                            roomList.length ? null : <div className="tip">NO game room now! why not create a new for playing immediately?</div>
                        }
                        {
                            roomList.map(({ roomName, peopleCount, owner }) => (
                                <Link
                                    to={'/' + roomName}
                                    className="room-item"
                                    key={roomName}
                                >
                                    <div className="row">
                                        <span className="key">Room Name: </span>
                                        <span className="value">{roomName}</span>
                                    </div>
                                    <div className="row">
                                        <span className="key">Players Number: </span>
                                        <span className="value">{peopleCount}</span>
                                    </div>
                                    <div className="row">
                                        <span className="key">Room Creator: </span>
                                        <span className="value">{ getPersonName(owner) }</span>
                                    </div>
                                </Link>
                            ))
                        }

                    </section>
                    <section className="footer-wrapper">
                        <p>
                            Rules: <br/>
                            1. Player can modify his/her player name by clicking on the name text and input a new name.<br/>
                            2. Player can join a exist room or create a new game room and paly with others.<br/>
                            3. Owner of game room cannot start Game unless there are more than 1 player in room.<br/>
                        </p>
                    </section>
                </section>
                
            </section>
        )
    }
    enterRoom (e) {
        if (!this.state.roomInputValue) return;
        history.push('/' + this.state.roomInputValue);
    }
    componentDidMount () {
        let { setRoomInfo } = this.props;
        document.title = `你画我猜online`;
        wsAction.leaveRoom();
        setRoomInfo({ roomName: '' });
    }
}