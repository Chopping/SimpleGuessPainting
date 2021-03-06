import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import * as networkActions from 'actions/network';
import wsAction from "../utils/wsAction";

@connect(
    state => ({
        loadingStatus: state.network.loadingStatus,
        webSocketStatus: state.network.webSocketStatus,
        user: state.user
    }),
    dispatch => bindActionCreators({...networkActions}, dispatch)
)
export default class Header extends Component {
    static defaultProps = {
        type: '',
    };
    state = {
        nameEditable: false,
        nameValue: '',
    };
    render () {
        const { loadingStatus, webSocketStatus, loading, loaded, wsConnect, wsDisconnect, user, title, type } = this.props;

        let typeNode = (type) => {
            switch (type) {
                case 'home':
                    return null;
                case 'room':
                    return (
                        <Link to={'/'}>
                            <span className="icon-wrapper">
                                <svg className="icon clickable" aria-hidden="true">
                                    <use xlinkHref="#icon-back"></use>
                                </svg>
                            </span>

                        </Link>
                    );
                default:
                    return null;
            }
        };
        return (
            <section className="fixed-header">
                <div className="item left">
                    {
                        webSocketStatus
                            ? null
                            : (
                                <span
                                    className={ `item wifi ${'alert-color'}` }
                                    title={'网络出错'}
                                >
                                    <svg className="icon" aria-hidden="true">
                                        <use xlinkHref="#icon-wifi"></use>
                                    </svg>
                                </span>
                            )
                    }
                    <span>
                        { typeNode(type) }
                    </span>
                    <span>
                        { type === 'room'
                            ? <span>Room：<span className="room-name">{ title }</span></span>
                            : <span>{ title }</span> }
                    </span>
                </div>


                <div className="item right" onClick={::this.switchInfoEditable}>

                    {
                        this.state.nameEditable
                            ? (
                                [
                                    <span key="icon" className="icon-wrapper">
                                        <svg className="icon" aria-hidden="true">
                                            <use xlinkHref="#icon-people"></use>
                                        </svg>
                                    </span>,
                                    <input
                                        key="input"
                                        className="input input-white input-md"
                                        value={this.state.nameValue}
                                        onChange={
                                            (e) => {
                                                this.setState({
                                                    nameValue: e.target.value
                                                })
                                            }
                                        }
                                        onKeyDown={
                                            (e) => {
                                                if (e.keyCode === 13) {
                                                    this.setName();
                                                }
                                            }
                                        }
                                    />,
                                    <span key="confirm" className="icon-wrapper" onClick={::this.setName}>
                                        <svg className="icon clickable" aria-hidden="true">
                                            <use xlinkHref="#icon-roundcheck"></use>
                                        </svg>
                                    </span>,
                                    <span key="cancel" className="icon-wrapper" onClick={
                                        () => {
                                            this.setState({
                                                nameEditable: false,
                                            });
                                        }
                                    }>
                                        <svg className="icon clickable" aria-hidden="true">
                                            <use xlinkHref="#icon-roundclose"></use>
                                        </svg>
                                    </span>
                                ]
                            )
                            : (
                                <div title="Click it to modify your name" className="clickable">
                                    <span>Player Name: </span>
                                    <span className="icon-wrapper">
                                        <svg style={{stroke: "#fff", fill: "#fff"}} className="icon" aria-hidden="true">
                                            <use xlinkHref="#icon-people"></use>
                                        </svg>
                                    </span>
                                    <span>{ user.info.name || user.id }</span>
                                </div>
                            )

                    }


                </div>


            </section>
        )
    }
    componentWillMount () {

    }
    switchInfoEditable () {
        if (!this.state.nameEditable) {
            this.setState({
                nameEditable: true,
                nameValue: this.props.user.info.name || this.props.user.id,
            });
        }
    }
    setName () {
        if (this.props.user.info.name !== this.state.nameValue) {
            wsAction.setUserInfo({
                name: this.state.nameValue,
            });
        }
        this.setState({
            nameEditable: false,
        });
    }
}