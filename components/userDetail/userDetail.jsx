import React from 'react';
import {
  Link
} from 'react-router-dom';
import './userDetail.css';

import axios from 'axios';

/**
 * Define UserDetail, a React componment of CS142 project #5
 */
class UserDetail extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      user: undefined,
    }
  }

  componentDidMount() {
    axios.get('/user/' + this.props.match.params.userId).then(r => {
      this.setState({user: r.data});
      this.props.topBarCallback('Profile of ' + r.data.first_name + ' ' + r.data.last_name);  
    }, r => {
      console.log(r.statusText);
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.match.params.userId !== prevProps.match.params.userId) {
      axios.get('/user/' + this.props.match.params.userId).then(r => {
        this.setState({user: r.data});
        this.props.topBarCallback('Profile of ' + r.data.first_name + ' ' + r.data.last_name);  
      }, r => {
        console.log(r.statusText);
      });
    }
  }  

  componentWillUnmount() {
    this.props.topBarCallback('Home'); 
  }

  render() {

    return (
      <div className="col s10 offset-s1">
        {this.state.user && (
          <div>
            <div className="section">
              <h4>{this.state.user.first_name + ' ' + this.state.user.last_name}</h4>
            </div>
            <div className="divider"/>
            <div className="section">
              <div className="cs142-main-flex">
                <div className="cs142-main-block">
                  <i className="small material-icons">report</i>
                </div>
                <div className="cs142-main-block">
                  {this.state.user.description}
                </div>
              </div>
              <div className="cs142-main-flex">
                <div className="cs142-main-block">
                  <i className="small material-icons">build</i>
                </div>
                <div className="cs142-main-block">
                  {this.state.user.occupation}
                </div>
              </div>
              <div className="cs142-main-flex">
                <div className="cs142-main-block">
                  <i className="small material-icons">location_on</i>
                </div>
                <div className="cs142-main-block">
                  {this.state.user.location}
                </div>
              </div>
            </div>
            <div className="divider"/>
            <div className="section">
              <Link className="orange-text" to={"/photos/" + this.state.user._id}>CLICK TO VIEW PHOTOS</Link>
            </div>
          </div>          
        )}
      </div>
    );
  }
}

export default UserDetail;
