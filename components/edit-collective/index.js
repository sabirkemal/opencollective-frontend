import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';

import { getErrorFromGraphqlException } from '../../lib/errors';
import { defaultBackgroundImage } from '../../lib/constants/collectives';

import Header from '../Header';
import Body from '../Body';
import Footer from '../Footer';
import SignInOrJoinFree from '../SignInOrJoinFree';
import CollectiveNavbar from '../CollectiveNavbar';
import NotificationBar from '../NotificationBar';
import Loading from '../Loading';

import Form from './Form';

class EditCollective extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object.isRequired,
    editCollective: PropTypes.func.isRequired,
    loggedInEditDataLoaded: PropTypes.bool.isRequired,
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.editCollective = this.editCollective.bind(this);
    this.state = { status: null, result: {} };
    this.messages = defineMessages({
      'collective.isArchived': {
        id: 'collective.isArchived',
        defaultMessage: '{name} has been archived.',
      },
      'collective.isArchived.edit.description': {
        id: 'collective.isArchived.edit.description',
        defaultMessage: 'This {type} has been archived and can no longer be used for any activities.',
      },
      'user.isArchived': {
        id: 'user.isArchived',
        defaultMessage: 'Account has been archived.',
      },
      'user.isArchived.edit.description': {
        id: 'user.isArchived.edit.description',
        defaultMessage: 'This account has been archived and can no longer be used for any activities.',
      },
    });
  }

  async editCollective(updatedCollective) {
    const collective = { ...updatedCollective };

    if (typeof collective.tags === 'string') {
      collective.tags = collective.tags.split(',').map(t => t.trim());
    }
    if (collective.backgroundImage === defaultBackgroundImage[collective.type]) {
      delete collective.backgroundImage;
    }

    collective.settings = {
      ...this.props.collective.settings,
      editor: collective.markdown ? 'markdown' : 'html',
      sendInvoiceByEmail: collective.sendInvoiceByEmail,
      apply: collective.application,
      tos: collective.tos,
    };

    delete collective.markdown;
    delete collective.sendInvoiceByEmail;
    delete collective.tos;
    delete collective.application;

    this.setState({ status: 'loading' });

    try {
      await this.props.editCollective(collective);
      this.setState({ status: 'saved', result: { error: null } });
      setTimeout(() => {
        this.setState({ status: null });
      }, 3000);
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err).message;
      this.setState({ status: null, result: { error: errorMsg } });
    }
  }

  render() {
    const { intl, LoggedInUser, collective, loggedInEditDataLoaded } = this.props;

    if (!collective || !collective.slug) {
      return <div />;
    }

    const canEditCollective = LoggedInUser && LoggedInUser.canEditCollective(collective);
    const notification = {};
    if (collective.isArchived && collective.type === 'USER') {
      notification.title = intl.formatMessage(this.messages['user.isArchived']);
      notification.description = intl.formatMessage(this.messages['user.isArchived.edit.description']);
      notification.status = 'collectiveArchived';
    } else if (collective.isArchived) {
      notification.title = intl.formatMessage(this.messages['collective.isArchived'], {
        name: collective.name,
      });
      notification.description = intl.formatMessage(this.messages['collective.isArchived.edit.description'], {
        type: collective.type.toLowerCase(),
      });
      notification.status = 'collectiveArchived';
    }

    return (
      <div className="EditCollective">
        <style jsx>
          {`
            .success {
              color: green;
            }
            .error {
              color: red;
            }
            .login {
              text-align: center;
            }
            .actions {
              text-align: center;
              margin-bottom: 5rem;
            }
          `}
        </style>

        <Header collective={collective} className={this.state.status} LoggedInUser={LoggedInUser} />

        <Body>
          {collective.isArchived && (
            <NotificationBar
              status={notification.status || status}
              title={notification.title}
              description={notification.description}
            />
          )}
          <CollectiveNavbar collective={collective} isAdmin={canEditCollective} onlyInfos={true} />
          <div className="content">
            {!canEditCollective && (
              <div className="login">
                <p>
                  You need to be logged in as the creator of this collective
                  <br />
                  or as a core contributor of the {collective.name} collective.
                </p>
                <SignInOrJoinFree />
              </div>
            )}
            {canEditCollective && !loggedInEditDataLoaded && <Loading />}
            {canEditCollective && loggedInEditDataLoaded && (
              <div>
                <Form
                  collective={collective}
                  LoggedInUser={LoggedInUser}
                  onSubmit={this.editCollective}
                  status={this.state.status}
                />
                <div className="actions">
                  <div className="result">
                    <div className="success">{this.state.result.success}</div>
                    <div className="error">{this.state.result.error}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Body>
        <Footer />
      </div>
    );
  }
}

export default injectIntl(EditCollective);
