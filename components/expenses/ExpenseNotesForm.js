import React from 'react';
import PropTypes from 'prop-types';
import StyledInputField from '../StyledInputField';
import StyledTextarea from '../StyledTextarea';
import { useIntl, FormattedMessage, defineMessages } from 'react-intl';
import { Span } from '../Text';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';

const msg = defineMessages({
  notesPlaceholder: {
    id: 'ExpenseSummary.addNotesPlaceholder',
    defaultMessage: 'Add notes',
  },
});

const PrivateNoteLabel = () => {
  return (
    <Span fontSize="Caption" color="black.700">
      <FormattedMessage
        id="ExpenseSummary.addNotesLabel"
        defaultMessage="Add more details, notes, or any important information"
      />
      &nbsp;&nbsp;
      <PrivateInfoIcon color="#969BA3" />
    </Span>
  );
};

const ExpenseNotesForm = ({ onChange, disabled, defaultValue }) => {
  const { formatMessage } = useIntl();
  return (
    <StyledInputField
      name="privateMessage"
      required={false}
      maxWidth={782}
      label={<PrivateNoteLabel />}
      labelProps={{ fontWeight: 'bold', fontSize: 'SmallCaption', mb: 3 }}
    >
      {inputProps => (
        <StyledTextarea
          {...inputProps}
          placeholder={formatMessage(msg.notesPlaceholder)}
          minHeight={80}
          onChange={onChange}
          disabled={disabled}
          defaultValue={defaultValue}
        />
      )}
    </StyledInputField>
  );
};

ExpenseNotesForm.propTypes = {
  defaultValue: PropTypes.string,
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
};

export default ExpenseNotesForm;
