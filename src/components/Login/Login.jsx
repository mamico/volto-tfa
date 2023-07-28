import { Login } from '@plone/volto/components';
import { QRCodeSVG } from 'qrcode.react';
import React, { Component } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Helmet } from '@plone/volto/helpers';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { Link } from 'react-router-dom';
import {
  Container,
  Button,
  Form,
  Input,
  Segment,
  Grid,
} from 'semantic-ui-react';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import qs from 'query-string';
import { withRouter } from 'react-router-dom';

import { Icon } from '@plone/volto/components';
import { login } from '@plone/volto/actions';
import { challenge, OTP_CHALLENGE_CANCEL } from '../../actions';
import { toast } from 'react-toastify';
import { Toast } from '@plone/volto/components';

import aheadSVG from '@plone/volto/icons/ahead.svg';
import clearSVG from '@plone/volto/icons/clear.svg';
import config from '@plone/volto/registry';

const messages = defineMessages({
  otpChallenge: {
    id: 'otpChallenge',
    defaultMessage: 'OTP Challenge',
  },
  loginFailed: {
    id: 'Login Failed',
    defaultMessage: 'Login Failed',
  },
  cancel: {
    id: 'Cancel',
    defaultMessage: 'Cancel',
  },
});

const AddTFA = ({ onChallenge, otpChallenge, intl }) => {
  const dispatch = useDispatch();

  return (
    <div id="page-login">
      <Helmet title={intl.formatMessage(messages.otpChallenge)} />
      <Container text>
        <Segment.Group raised>
          <Segment className="primary">
            <FormattedMessage id="Log In" defaultMessage="Login" />
          </Segment>
          <Segment secondary>
            <FormattedMessage
              id="Sign in to start session"
              defaultMessage="Sign in to start session"
            />
          </Segment>
          <Segment className="form">
            <Form method="post" onSubmit={onChallenge}>
              <Form.Field inline className="help">
                <Grid>
                  {otpChallenge.qr_code && (
                    <Grid.Row stretched>
                      <Grid.Column width="12">
                        <QRCodeSVG size={200} value={otpChallenge.qr_code} />
                      </Grid.Column>
                    </Grid.Row>
                  )}
                  <Grid.Row stretched>
                    <Grid.Column width="4">
                      <div className="wrapper">
                        <label htmlFor="login">
                          <FormattedMessage
                            id="OTP Token"
                            defaultMessage="OTP Token"
                          />
                        </label>
                      </div>
                    </Grid.Column>
                    <Grid.Column width="8">
                      {/* eslint-disable jsx-a11y/no-autofocus */}
                      <Input
                        id="otp"
                        name="otp"
                        placeholder={intl.formatMessage(messages.otpChallenge)}
                        autoFocus
                      />
                    </Grid.Column>
                  </Grid.Row>
                </Grid>
              </Form.Field>

              {/* <input type="submit" value="Submit" /> */}
              <Segment className="actions" clearing>
                <Button
                  basic
                  primary
                  icon
                  floated="right"
                  type="submit"
                  id="login-form-submit"
                  aria-label={intl.formatMessage(messages.otpChallenge)}
                  title={intl.formatMessage(messages.otpChallenge)}
                  loading={otpChallenge.loading}
                >
                  <Icon className="circled" name={aheadSVG} size="30px" />
                </Button>
                <Button
                  basic
                  secondary
                  icon
                  floated="right"
                  id="login-form-cancel"
                  as={Link}
                  onClick={(e) => {
                    e.preventDefault();
                    dispatch({ type: OTP_CHALLENGE_CANCEL });
                  }}
                  aria-label={intl.formatMessage(messages.cancel)}
                  title={intl.formatMessage(messages.cancel)}
                >
                  <Icon className="circled" name={clearSVG} size="30px" />
                </Button>
              </Segment>
            </Form>
          </Segment>
        </Segment.Group>
        {/* <pre>{otpChallenge.qr_code}</pre>
        <pre>{JSON.stringify(otpChallenge)}</pre> */}
      </Container>
    </div>
  );
};

class TFALogin extends Component {
  constructor(props) {
    super(props);
    this.onChallenge = this.onChallenge.bind(this);
  }

  /**
   * Component will receive props
   * @method componentWillReceiveProps
   * @param {Object} nextProps Next properties
   * @returns {undefined}
   */
  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.token) {
      this.props.history.push(this.props.returnUrl || '/');
      if (toast.isActive('loggedOut')) {
        toast.dismiss('loggedOut');
      }
      if (toast.isActive('loginFailed')) {
        toast.dismiss('loginFailed');
      }
    }
    if (nextProps.error) {
      if (toast.isActive('loggedOut')) {
        toast.dismiss('loggedOut');
      }
      if (!toast.isActive('loginFailed')) {
        toast.error(
          <Toast
            error
            title={this.props.intl.formatMessage(messages.loginFailed)}
            content={JSON.stringify(nextProps.error)}
          />,
          { autoClose: false, toastId: 'loginFailed' },
        );
      }
    }
  }

  onChallenge(event) {
    this.props.challenge(
      this.props.otpChallenge.action,
      this.props.otpChallenge.login,
      document.getElementsByName('otp')[0].value,
    );
    event.preventDefault();
  }

  render() {
    return (() => {
      switch (this.props.otpChallenge?.action) {
        case 'add':
        case 'challenge':
          return <AddTFA onChallenge={this.onChallenge} {...this.props} />;
        default:
          return <Login {...this.props} />;
      }
    })();
  }
}

export default compose(
  withRouter,
  injectIntl,
  connect(
    (state, props) => {
      return {
        error: state.userSession.login.error,
        loading: state.userSession.login.loading,
        token: state.userSession.token,
        otpChallenge: state.otpChallenge,
        returnUrl:
          qs.parse(props.location.search).return_url ||
          props.location.pathname
            .replace(/\/login\/?$/, '')
            .replace(/\/logout\/?$/, '') ||
          '/',
      };
    },
    { login, challenge },
  ),
)(TFALogin);
