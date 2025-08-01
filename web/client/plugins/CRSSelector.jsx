/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { has, includes, indexOf } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { Dropdown, Glyphicon, ListGroupItem } from 'react-bootstrap';
import { connect } from '../utils/PluginsUtils';
import { createSelector } from 'reselect';

import { setInputValue } from '../actions/crsselector';
import { changeMapCrs } from '../actions/map';
import { error } from '../actions/notifications';
import Message from '../components/I18N/Message';
import CrsSelectorMenu from '../components/mapcontrols/crsselectormenu/CrsSelectorMenu';
import tooltip from '../components/misc/enhancers/tooltip';
import crsselectorReducers from '../reducers/crsselector';
import annotationsReducers from './Annotations/reducers/annotations';
import { editingSelector } from '../plugins/Annotations/selectors/annotations';
import { measureSelector, printSelector, queryPanelSelector } from '../selectors/controls';
import { crsInputValueSelector } from '../selectors/crsselector';
import { modeSelector } from '../selectors/featuregrid';
import { currentBackgroundSelector } from '../selectors/layers';
import { projectionDefsSelector, projectionSelector } from '../selectors/map';
import { bottomPanelOpenSelector } from '../selectors/maplayout';
import { isCesium } from '../selectors/maptype';
import { userRoleSelector } from '../selectors/security';
import { filterCRSList, getAvailableCRS, normalizeSRS } from '../utils/CoordinatesUtils';
import ButtonRB from '../components/misc/Button';
const Button = tooltip(ButtonRB);


class Selector extends React.Component {
    static propTypes = {
        selected: PropTypes.string,
        value: PropTypes.string,
        projections: PropTypes.array,
        availableCRS: PropTypes.object,
        filterAllowedCRS: PropTypes.array,
        projectionDefs: PropTypes.array,
        additionalCRS: PropTypes.object,
        setCrs: PropTypes.func,
        typeInput: PropTypes.func,
        enabled: PropTypes.bool,
        currentBackground: PropTypes.object,
        onError: PropTypes.func,
        allowedRoles: PropTypes.array,
        currentRole: PropTypes.string
    };
    static defaultProps = {
        availableCRS: getAvailableCRS(),
        setCrs: ()=> {},
        typeInput: () => {},
        enabled: true,
        allowedRoles: ['ALL']
    };

    state = {
        toggled: false
    };

    render() {

        let list = [];
        let availableCRS = {};
        if (Object.keys(this.props.availableCRS).length) {
            availableCRS = filterCRSList(this.props.availableCRS, this.props.filterAllowedCRS, this.props.additionalCRS, this.props.projectionDefs );
        }
        for (let crs in availableCRS) {
            if (availableCRS.hasOwnProperty(crs)) {
                list.push({value: crs});
            }
        }
        const currentCRS = normalizeSRS(this.props.selected, this.props.filterAllowedCRS);
        const compatibleCrs = ['EPSG:4326', 'EPSG:3857', 'EPSG:900913'];
        const allowedLayerTypes = ["wms", "osm", "tileprovider", "empty"];
        const changeCrs = (crs) => {
            if ( indexOf(compatibleCrs, crs) > -1 || indexOf(allowedLayerTypes, this.props.currentBackground.type) > -1 ||
            (this.props.currentBackground.allowedSRS && has(this.props.currentBackground.allowedSRS, crs))) {
                this.props.setCrs(crs);
            } else {
                this.props.onError({
                    title: "error",
                    message: "notification.incompatibleBackgroundAndProjection",
                    action: {
                        label: "close"
                    },
                    position: "tc",
                    uid: "3"
                });
            }
        };
        const isAllowed = includes(this.props.allowedRoles, "ALL") || includes(this.props.allowedRoles, this.props.currentRole);
        return (this.props.enabled && isAllowed ? <Dropdown
            dropup
            className="ms-prj-selector"
            onToggle={(toggled) => this.setState({ toggled })}
        >
            <Button
                bsRole="toggle"
                bsStyle="primary"
                className={`map-footer-btn btn-${this.state.toggled ? 'success' : 'primary'}`}
                tooltip={<Message msgId="showCrsSelector"/>}
                tooltipPosition="top">
                <Glyphicon glyph="crs" />
            </Button>
            <CrsSelectorMenu bsRole="menu" value={this.props.value} selected={currentCRS} projectionDefs={this.props.projectionDefs}
                filterAllowedCRS={this.props.filterAllowedCRS} additionalCRS={this.props.additionalCRS} changeInputValue={v => this.props.typeInput(v)}>
                {list.map(crs =>
                    <ListGroupItem
                        key={crs.value}
                        active={currentCRS === crs.value}
                        onClick= { es => changeCrs(es.target.textContent)}
                        eventKey={crs.value}
                    >
                        {crs.value}
                    </ListGroupItem>)}
            </CrsSelectorMenu>
        </Dropdown> : null );
    }
}

const crsSelector = connect(
    createSelector(
        userRoleSelector,
        currentBackgroundSelector,
        projectionSelector,
        projectionDefsSelector,
        crsInputValueSelector,
        modeSelector,
        isCesium,
        bottomPanelOpenSelector,
        measureSelector,
        queryPanelSelector,
        printSelector,
        editingSelector,
        ( currentRole, currentBackground, selected, projectionDefs, value, mode, cesium, bottomPanel, measureEnabled, queryPanelEnabled, printEnabled, editingAnnotations) => ({
            currentRole,
            currentBackground,
            selected,
            projectionDefs,
            value,

            enabled: (mode !== 'EDIT') && !cesium && !bottomPanel && !measureEnabled && !queryPanelEnabled && !printEnabled && !editingAnnotations
        })
    ), {
        typeInput: setInputValue,
        setCrs: changeMapCrs,
        onError: error
    }
)(Selector);


/**
  * CRSSelector Plugin is a plugin that switches from to the pre-configured projections.
  * it gets displayed into the mapFooter plugin
  * @name CRSSelector
  * @memberof plugins
  * @class
  * @prop {object[]} projectionDefs list of additional project definitions
  * @prop {string[]} cfg.filterAllowedCRS list of allowed crs in the combobox list to used as filter for the one of retrieved proj4.defs()
  * @prop {object} cfg.additionalCRS additional crs added to the list. The label param is used after in the combobox.
  * @prop {array} cfg.allowedRoles list of the authorized roles that can use the plugin, if you want all users to access the plugin, add a "ALL" element to the array.
  * @example
  * // If you want to add some crs you need to provide a definition and adding it in the additionalCRS property
  * // Put the following lines at the first level of the localconfig
  * {
  *   "projectionDefs": [{
  *     "code": "EPSG:3003",
  *     "def": "+proj=tmerc +lat_0=0 +lon_0=9 +k=0.9996 +x_0=1500000 +y_0=0 +ellps=intl+towgs84=-104.1,-49.1,-9.9,0.971,-2.917,0.714,-11.68 +units=m +no_defs",
  *     "extent": [1241482.0019, 973563.1609, 1830078.9331, 5215189.0853],
  *     "worldExtent": [6.6500, 8.8000, 12.0000, 47.0500]
  *   }]
  * }
  * @example
  * // And configure the new projection for the plugin as below:
  * { "name": "CRSSelector",
  *   "cfg": {
  *     "additionalCRS": {
  *       "EPSG:3003": { "label": "EPSG:3003" }
  *     },
  *     "filterAllowedCRS": ["EPSG:4326", "EPSG:3857"],
  *     "allowedRoles" : ["ADMIN", "USER", "ALL"]
  *   }
  * }
*/
export default {
    CRSSelectorPlugin: Object.assign(crsSelector, {
        disablePluginIf: "{state('mapType') === 'leaflet'}",
        MapFooter: {
            name: "crsSelector",
            position: 10,
            tool: true,
            priority: 1
        }
    }),
    reducers: {
        crsselector: crsselectorReducers,
        annotations: annotationsReducers
    },
    epics: {}
};
