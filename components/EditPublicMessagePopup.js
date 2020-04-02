import React, { useState } from 'react';
import { Popper } from 'react-popper';
import styled from 'styled-components';
import { createPortal } from 'react-dom';
import { Mutation } from '@apollo/react-components';
import { Times } from '@styled-icons/fa-solid/Times';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages } from 'react-intl';
import gql from 'graphql-tag';
import { Box, Flex } from '@rebass/grid';

import { Span } from './Text';
import StyledButton from './StyledButton';
import StyledInput from './StyledInput';
import { MAX_CONTRIBUTORS_PER_CONTRIBUTE_CARD } from './contribute-cards/Contribute';
import { getCollectivePageQuery } from '../components/collective-page/graphql/queries';
import { getTierPageQuery } from '../components/tier-page/graphql/queries';

import { fadeIn } from './StyledKeyframes';

/** Pop-up for editing the public message */
const EditPublicMessagePopupContainer = styled.div`
  position: absolute;
  padding: 8px;
  border: 1px solid #f3f3f3;
  border-radius: 8px;
  background: white;
  box-shadow: 0px 4px 8px rgba(20, 20, 20, 0.16);
  animation: ${fadeIn} 0.3s ease-in-out;
  z-index: 1;
`;

const Arrow = styled('div')`
  position: absolute;
  width: 3em;
  height: 3em;
  &[data-placement*='bottom'] {
    top: 0;
    left: 0;
    margin-top: -0.9em;
    width: 3em;
    height: 1em;
    &::before {
      border-width: 0 1.5em 1em 1.5em;
      border-color: transparent transparent #ffffff transparent;
    }
  }
  &[data-placement*='top'] {
    bottom: 0;
    left: 0;
    margin-bottom: -0.9em;
    width: 3em;
    height: 1em;
    &::before {
      border-width: 1em 1.5em 0 1.5em;
      border-color: #ffffff transparent transparent transparent;
    }
  }
  &[data-placement*='right'] {
    left: 0;
    margin-left: -0.9em;
    height: 3em;
    width: 1em;
    &::before {
      border-width: 1.5em 1em 1.5em 0;
      border-color: transparent #ffffff transparent transparent;
    }
  }
  &[data-placement*='left'] {
    right: 0;
    margin-right: -0.9em;
    height: 3em;
    width: 1em;
    &::before {
      border-width: 1.5em 0 1.5em 1em;
      border-color: transparent transparent transparent #ffffff;
    }
  }
  &::before {
    content: '';
    margin: auto;
    display: block;
    width: 0;
    height: 0;
    border-style: solid;
  }
`;

const EditPublicMessageMutation = gql`
  mutation EditPublicMessageMutation($FromCollectiveId: Int!, $CollectiveId: Int!, $message: String) {
    editPublicMessage(FromCollectiveId: $FromCollectiveId, CollectiveId: $CollectiveId, message: $message) {
      id
      publicMessage
      tier {
        id
      }
      collective {
        id
        slug
      }
    }
  }
`;

const messages = defineMessages({
  publicMessagePlaceholder: {
    id: 'contribute.publicMessage.placeholder',
    defaultMessage: 'Motivate others to contribute in 140 characters :) ...',
  },
});

const PUBLIC_MESSAGE_MAX_LENGTH = 140;

function EditPublicMessagePopup({ fromCollectiveId, collectiveId, cardRef, onClose, message, intl }) {
  // Popup root element reference
  const [messageDraft, setMessageDraft] = useState(message || '');

  return createPortal(
    <Mutation mutation={EditPublicMessageMutation}>
      {(submitMessage, { loading, error }) => (
        <Popper referenceElement={cardRef.current} placement="right">
          {({ ref, style, placement, arrowProps }) => (
            <EditPublicMessagePopupContainer
              data-cy="EditPublicMessagePopup"
              ref={ref}
              style={style}
              data-placement={placement}
            >
              <Flex justifyContent="flex-end">
                <Times size="1em" color="#a2a2a2" cursor="pointer" onClick={onClose} />
              </Flex>
              <Flex flexDirection="column" p={2}>
                <Span fontSize="Paragraph" color="black.600" mb={2}>
                  <FormattedMessage id="contribute.publicMessage" defaultMessage="Leave a public message (Optional)" />
                </Span>

                <StyledInput
                  name="publicMessage"
                  as="textarea"
                  px={10}
                  py={10}
                  width={240}
                  height={112}
                  fontSize="Paragraph"
                  style={{ resize: 'none' }}
                  placeholder={intl.formatMessage(messages.publicMessagePlaceholder)}
                  value={messageDraft}
                  maxLength={PUBLIC_MESSAGE_MAX_LENGTH}
                  onChange={e => setMessageDraft(e.target.value)}
                  disabled={loading}
                />
                {error && (
                  <Span color="red.500" fontSize="Caption" mt={2}>
                    {error}
                  </Span>
                )}
                <Box m="0 auto">
                  <StyledButton
                    data-cy="EditPublicMessagePopup_SubmitButton"
                    buttonSize="small"
                    fontWeight="bold"
                    px={4}
                    mt={3}
                    onClick={async () => {
                      await submitMessage({
                        variables: {
                          /** Sometimes the fromCollectiveId is of type string. We use the unary plus
                           * operator (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Arithmetic_Operators#Unary_plus_())
                           * to make sure we are sending a number to the backend.
                           * TODO: Find the reason why a collective id is of type string when it should be a number.
                           */
                          FromCollectiveId: fromCollectiveId,
                          CollectiveId: collectiveId,
                          message: messageDraft ? messageDraft.trim() : null,
                        },
                        // Update cache after mutation
                        refetchQueries({ data: { editPublicMessage } }) {
                          const [member] = editPublicMessage;
                          const collectiveSlug = member.collective.slug;
                          const tier = member.tier;
                          const queries = [
                            {
                              query: getCollectivePageQuery,
                              variables: {
                                slug: collectiveSlug,
                                nbContributorsPerContributeCard: MAX_CONTRIBUTORS_PER_CONTRIBUTE_CARD,
                              },
                            },
                          ];
                          if (tier) {
                            queries.push({
                              query: getTierPageQuery,
                              variables: { tierId: tier.id },
                            });
                          }
                          return queries;
                        },
                      });
                      onClose();
                    }}
                    loading={loading}
                  >
                    <FormattedMessage id="button.submit" defaultMessage="Submit" />
                  </StyledButton>
                </Box>
              </Flex>
              <Arrow {...arrowProps} data-placement={placement} />
            </EditPublicMessagePopupContainer>
          )}
        </Popper>
      )}
    </Mutation>,
    document.body,
  );
}

EditPublicMessagePopup.defaultProps = {
  message: '',
};

EditPublicMessagePopup.propTypes = {
  fromCollectiveId: PropTypes.number.isRequired,
  collectiveId: PropTypes.number.isRequired,
  cardRef: PropTypes.shape({ current: PropTypes.object }).isRequired,
  onClose: PropTypes.func.isRequired,
  message: PropTypes.string,
  intl: PropTypes.object,
};

export default EditPublicMessagePopup;
