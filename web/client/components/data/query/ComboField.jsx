/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';

import { getMessageById } from '../../../utils/LocaleUtils';
import PropTypes from 'prop-types';
import { Tooltip } from 'react-bootstrap';
import OverlayTrigger from '../../misc/OverlayTrigger';
import { DropdownList, Multiselect } from 'react-widgets';
import Message from '../../../components/I18N/Message';

class ComboField extends React.Component {
    static propTypes = {
        dropUp: PropTypes.bool,
        busy: PropTypes.bool,
        style: PropTypes.object,
        valueField: PropTypes.string,
        textField: PropTypes.string,
        placeholder: PropTypes.object,
        itemComponent: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
        fieldOptions: PropTypes.array,
        fieldName: PropTypes.string,
        fieldRowId: PropTypes.number,
        attType: PropTypes.string,
        fieldValue: PropTypes.oneOfType([
            PropTypes.number,
            PropTypes.string,
            PropTypes.array
        ]),
        fieldException: PropTypes.oneOfType([
            PropTypes.object,
            PropTypes.string
        ]),
        comboFilter: PropTypes.oneOfType([
            PropTypes.bool,
            PropTypes.string,
            PropTypes.func
        ]),
        groupBy: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.func
        ]),
        multivalue: PropTypes.bool,
        disabled: PropTypes.bool,
        options: PropTypes.object,
        onSelect: PropTypes.func,
        onToggle: PropTypes.func,
        onSearch: PropTypes.func,
        onUpdateField: PropTypes.func,
        onClick: PropTypes.func,
        onUpdateExceptionField: PropTypes.func
    };

    static contextTypes = {
        messages: PropTypes.object
    };

    static defaultProps = {
        options: {},
        busy: false,
        style: {
            width: "100%"
        },
        placeholder: <Message msgId="queryform.comboField.default_placeholder"/>,
        multivalue: false,
        disabled: false,
        valueField: null,
        textField: null,
        fieldOptions: [],
        fieldName: null,
        itemComponent: null,
        fieldRowId: null,
        fieldValue: null,
        fieldException: null,
        comboFilter: false,
        groupBy: () => {},
        onSelect: () => {},
        onToggle: () => {},
        onSearch: () => {},
        onUpdateField: () => {},
        onUpdateExceptionField: () => {}
    };

    render() {
        let style = Object.assign({}, {borderColor: "#dedede"}, this.props.style);

        if (this.props.fieldException) {
            style = Object.assign({}, style, {borderColor: "#FF0000"});
        }

        const ListComponent = this.props.multivalue ? Multiselect : DropdownList;

        const list = this.props.valueField !== null && this.props.textField !== null ?
            (<ListComponent
                dropUp={this.props.dropUp}
                {...this.props.options}
                busy={this.props.busy}
                disabled={this.props.disabled}
                itemComponent={this.props.itemComponent}
                valueField={this.props.valueField}
                textField={this.props.textField}
                data={this.props.fieldOptions}
                value={this.props.fieldValue}
                caseSensitive={false}
                minLength={3}
                placeholder={this.props.placeholder}
                messages={{open: getMessageById(this.context.messages, "queryform.comboField.drop_down")}}
                filter={this.props.comboFilter}
                style={style}
                groupBy={this.props.groupBy}
                onSelect={this.props.onSelect}
                onChange={(value) => this.props.onUpdateField(this.props.fieldRowId, this.props.fieldName, this.props.multivalue ? value : value[this.props.valueField], this.props.attType)}
                onToggle={this.props.onToggle}
                onSearch={this.props.onSearch}/>)
            :
            (<ListComponent
                dropUp={this.props.dropUp}
                {...this.props.options}
                busy={this.props.busy}
                disabled={this.props.disabled}
                itemComponent={this.props.itemComponent}
                data={this.props.fieldOptions}
                value={this.props.fieldValue}
                caseSensitive={false}
                minLength={3}
                placeholder={this.props.placeholder}
                messages={{open: getMessageById(this.context.messages, "queryform.comboField.drop_down")}}
                filter={this.props.comboFilter}
                style={style}
                groupBy={this.props.groupBy}
                onSelect={this.props.onSelect}
                onChange={(value) => this.props.onUpdateField(this.props.fieldRowId, this.props.fieldName, value, this.props.attType)}
                onToggle={this.props.onToggle}
                onSearch={this.props.onSearch}/>)
        ;

        return this.props.fieldException ?
            <OverlayTrigger placement="bottom" overlay={(
                <Tooltip id={this.props.fieldRowId + "_tooltip"}>
                    <strong>
                        {this.props.fieldException}
                    </strong>
                </Tooltip>
            )}>
                {list}
            </OverlayTrigger>
            :
            list
        ;
    }
}

export default ComboField;
