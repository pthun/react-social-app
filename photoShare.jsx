import React from 'react';
import ReactDOM from 'react-dom';
import {
  HashRouter, Route, Switch
} from 'react-router-dom';

// import necessary components
import TopBar from './components/topBar/TopBar';
import UserDetail from './components/userDetail/UserDetail';
import UserList from './components/userList/UserList';
import UserPhotos from './components/userPhotos/UserPhotos';
import UserComments from './components/userComments/UserComments';

import axios from 'axios';

import './node_modules/materialize-css/dist/css/materialize.css';
import './styles/main.css';

class PhotoShare extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      title: 'Philipp\'s Photo App',
      page: 'Home',
      version: 'Version',
      advancedFeatures: false,
    }

    this.handlePageChange = this.handlePageChange.bind(this);
    this.toggleFeatures = this.toggleFeatures.bind(this);
  }

  // In theory would need to catch before this unmounts as async code may still be running. Same for subcomponents. TBD
  componentDidMount() {
    axios.get('/test/info').then(r => {
      this.setState({version: 'Version: ' + r.data.__v});
    }, r => {
      console.log(r.statusText);
    });
  }

  // Implemented this way to experiment with state - alternative is to parse url using withNavigation
  handlePageChange(page) {
    this.setState({page: page});
  }

  toggleFeatures() {
    this.setState({advancedFeatures: !this.state.advancedFeatures});
  }

  // [May at some point want to componentize this + add ability to sort]
  render() {
    return (
      <HashRouter>
      <div className="fullheight">
        <TopBar title={this.state.title} page={this.state.page} version={this.state.version}/>
        <div className="row flex nomargin fullheight">
          <div className="col s4 grey lighten-4 fullheight">
            {/* This is the advanced features switch. May componentize later */}
            <div className="collection with-header nomargin">
              <ul>
                <li className="collection-item transparent">
                  <div>Advanced Features: 
                    <div className="secondary-content">
                      <div className="switch">
                        <label>
                          Off
                          <input type="checkbox" checked={this.state.advancedFeatures} onChange={this.toggleFeatures}/>
                          <span className="lever"></span>
                          On
                        </label>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
            <UserList advancedFeatures={this.state.advancedFeatures}/>
          </div>
          <div className="col s8">
            <Switch>
              <Route path="/users/:userId"
                render={ props => <UserDetail {...props} topBarCallback={this.handlePageChange}/> }
              />
              <Route path="/photos/:userId"
                render ={ props => <UserPhotos {...props} topBarCallback={this.handlePageChange} 
                advancedFeatures={this.state.advancedFeatures}/> }
              />
              {/* This is only available in advanced features */}
              <Route path="/comments/:userId"
                render ={ props => <UserComments {...props} topBarCallback={this.handlePageChange}/> }
              />
              <Route path="/users" render={() => <div>Test</div>}  />
            </Switch>
          </div>
        </div>
      </div>
    </HashRouter>
    );
  }
}


ReactDOM.render(
  <PhotoShare />,
  document.getElementById('photoshareapp'),
);
