import React from 'react';
import './TopBar.css';


/**
 * Define TopBar, a React componment of CS142 project #5
 */
class TopBar extends React.Component {
  constructor(props) {
    super(props);

  }

  render() {
    return (
      <div className="navbar-fixed">
        <nav className="light-blue">
          <div className="nav-wrapper cs142-main-navbar">
            <div className="brand-logo">{this.props.title}</div>
            <ul id="nav-mobile" className="right">
              <li className="cs142-main-padded">Current Page: {this.props.page}</li>
              <li className="cs142-main-padded">{this.props.version}</li>
            </ul>
          </div>
        </nav>
      </div>
    );
  }
}

export default TopBar;
