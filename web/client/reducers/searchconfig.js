/*
* Copyright 2017, GeoSolutions Sas.
* All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree.
*/
import { SET_SEARCH_CONFIG_PROP, RESET_SEARCH_CONFIG, UPDATE_SERVICE } from '../actions/searchconfig';

import { RESET_CONTROLS } from '../actions/controls';
import { MAP_CONFIG_LOADED } from '../actions/config';

function searchconfig(state = null, action) {
    switch (action.type) {
    case SET_SEARCH_CONFIG_PROP:
        return Object.assign({}, state, {
            [action.property]: action.value
        });
    case MAP_CONFIG_LOADED: {
        const textSearchConfig = action.config.map.text_search_config || action.config.map.text_serch_config;
        return Object.assign({}, state, {textSearchConfig});
    }
    case RESET_CONTROLS:
    case RESET_SEARCH_CONFIG: {
        return Object.assign({}, state, {service: undefined, page: action.page, init_service_values: undefined, editIdx: undefined});
    }
    case UPDATE_SERVICE: {
        let newServices = (state.textSearchConfig && state.textSearchConfig.services || []).slice();
        // Convert priority to int
        const newService = Object.assign({}, action.service, {priority: parseInt(action.service.priority, 10)});
        if (action.idx !== -1) {
            newServices[action.idx] = newService;
        } else {
            newServices.push(newService);
        }
        return Object.assign({}, state, {service: undefined, page: 0, init_service_values: undefined, editIdx: undefined, textSearchConfig: {services: newServices, override: state.textSearchConfig && state.textSearchConfig.override || false}});
    }
    default:
        return state;
    }
}

export default searchconfig;
