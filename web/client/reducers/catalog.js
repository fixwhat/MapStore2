/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
    RECORD_LIST_LOADED,
    RECORD_LIST_LOAD_ERROR,
    CHANGE_CATALOG_FORMAT,
    ADD_LAYER_ERROR,
    RESET_CATALOG,
    CHANGE_SELECTED_SERVICE,
    CHANGE_CATALOG_MODE,
    CHANGE_TITLE,
    CHANGE_TEXT,
    CHANGE_SERVICE_PROPERTY,
    CHANGE_TYPE,
    CHANGE_URL,
    CHANGE_SERVICE_FORMAT,
    FOCUS_SERVICES_LIST,
    ADD_CATALOG_SERVICE,
    UPDATE_CATALOG_SERVICES,
    DELETE_CATALOG_SERVICE,
    SAVING_SERVICE,
    CHANGE_METADATA_TEMPLATE,
    SET_LOADING,
    TOGGLE_THUMBNAIL,
    TOGGLE_TEMPLATE,
    TOGGLE_ADVANCED_SETTINGS,
    FORMAT_OPTIONS_LOADING,
    SHOW_FORMAT_ERROR,
    SET_FORMAT_OPTIONS,
    NEW_SERVICE_STATUS,
    INIT_PLUGIN
} from '../actions/catalog';
import {
    CLEAR_SECURITY,
    SET_CREDENTIALS
} from '../actions/security';

import { MAP_CONFIG_LOADED } from '../actions/config';
import { set } from '../utils/ImmutableUtils';
import { isNil } from 'lodash';
import uuid from 'uuid';

export const emptyService = {
    url: "",
    type: "wms",
    title: "",
    isNew: true,
    autoload: false,
    showAdvancedSettings: false,
    showTemplate: false,
    hideThumbnail: false,
    metadataTemplate: "<p>${description}</p>"
};

function catalog(state = {
    "default": {
        services: {},
        selectedService: "",
        newService: {}
    },
    delayAutoSearch: 1000,
    loading: false,
    showFormatError: false,
    pageSize: 4,
    services: {},
    selectedService: "",
    newService: {}
}, action) {
    switch (action.type) {
    case INIT_PLUGIN:
        return {
            ...state,
            editingAllowedRoles: action?.options?.editingAllowedRoles || state.editingAllowedRoles,
            editingAllowedGroups: action?.options?.editingAllowedGroups || state.editingAllowedGroups
        };
    case SAVING_SERVICE:
        return {
            ...state,
            saving: action.status
        };
    case RECORD_LIST_LOADED:
        return Object.assign({}, state, {
            result: action.result,
            searchOptions: action.searchOptions,
            loadingError: null,
            layerError: null,
            loading: false
        });
    case RESET_CATALOG:
        return Object.assign({}, state, {
            result: null,
            loadingError: null,
            searchOptions: null/*
                MV: saida added but maybe they are unused,
                at least action.format doesnt exist in the action,

                format: action.format,
                layerError: null*/
        });
    case RECORD_LIST_LOAD_ERROR:
        return Object.assign({}, state, {
            result: null,
            searchOptions: null,
            loadingError: action.error,
            loading: false,
            layerError: null
        });
    case CHANGE_CATALOG_FORMAT:
        return Object.assign({}, state, {
            result: null,
            loadingError: null,
            format: action.format,
            layerError: null
        });
    case ADD_LAYER_ERROR:
        return Object.assign({}, state, {layerError: action.error});
    case CHANGE_CATALOG_MODE:
        return Object.assign({}, state, {
            newService: action.isNew ? emptyService : Object.assign({}, state.services && state.services[state.selectedService || ""] || {}, {oldService: state.selectedService || ""}),
            mode: action.mode,
            result: null,
            showFormatError: false,
            loadingError: null,
            layerError: null});
    case MAP_CONFIG_LOADED: {
        if (state && !isNil(state.default)) {
            if (action.config && !isNil(action.config.catalogServices)) {
                return Object.assign({}, state, {services: action.config.catalogServices.services, selectedService: action.config.catalogServices.selectedService });
            }
            return Object.assign({}, state, {services: state.default.services, selectedService: state.default.selectedService });
        }
        return state;
    }
    case FOCUS_SERVICES_LIST:
        return set("openCatalogServiceList", action.status, state);
    case CHANGE_TEXT:
        return set("searchOptions.text", action.text, state);
    case CHANGE_SERVICE_PROPERTY: {
        return  set(`newService.${action.property}`, action.value, state);
    }
    case CHANGE_TITLE:
        return set("newService.title", action.title, state);
    case CHANGE_URL:
        return set("newService.url", action.url, set("showFormatError", false, state));
    case CHANGE_SERVICE_FORMAT:
        return set("newService.format", action.format, state);
    case CHANGE_TYPE: {
        const type = action.newType.toLowerCase();
        let templateOptions = {};
        if (type !== "csw") {
            // reset the template options
            templateOptions = {showTemplate: false, metadataTemplate: ""};
        }
        return Object.assign({}, state, {newService: Object.assign({}, state.newService, {type, ...templateOptions})});
    }
    case ADD_CATALOG_SERVICE: {
        const { isNew, ...service } = action.service;
        const selectedService = isNew ? service.title + uuid() : state.selectedService;
        const newServices = Object.assign({}, state.services, { [selectedService]: service});
        return Object.assign({}, state, {
            services: newServices,
            selectedService,
            mode: "view",
            result: null,
            loadingError: null,
            searchOptions: Object.assign({}, state.searchOptions, {
                text: ""
            }),
            layerError: null
        });
    }
    case UPDATE_CATALOG_SERVICES: {
        return {...state,
            services: action.services
        };
    }
    case CHANGE_SELECTED_SERVICE: {
        if (action.service !== state.selectedService) {
            return Object.assign({}, state, {
                selectedService: action.service,
                result: null,
                loadingError: null,
                layerError: null
            });
        }
        return state;
    }
    case DELETE_CATALOG_SERVICE: {
        let newServices;
        let selectedService = "";
        newServices = Object.assign({}, state.services);
        delete newServices[action.service];
        if (Object.keys(newServices).length) {
            selectedService = newServices[Object.keys(newServices)[0]].title;
        }
        return Object.assign({}, state, {
            services: newServices,
            selectedService,
            mode: "view",
            result: null,
            loadingError: null,
            layerError: null
        });
    }
    case TOGGLE_THUMBNAIL: {
        return set("newService.hideThumbnail", !state.newService.hideThumbnail, state);
    }
    case SET_LOADING: {
        return set("loading", action.loading, state);
    }
    case CHANGE_METADATA_TEMPLATE: {
        return set("newService.metadataTemplate", action.metadataTemplate, state);
    }
    case TOGGLE_TEMPLATE: {
        let newState = set("newService.showTemplate", !state.newService.showTemplate, state);
        if (newState.newService.showTemplate) {
            newState = set("newService.metadataTemplate", newState.newService.metadataTemplate || "<p>${description}</p>", newState);
        }
        return newState;
    }
    case TOGGLE_ADVANCED_SETTINGS: {
        return set("newService.showAdvancedSettings", !state.newService.showAdvancedSettings, state);
    }
    case FORMAT_OPTIONS_LOADING: {
        return set("formatsLoading", action.loading, state);
    }
    case SHOW_FORMAT_ERROR: {
        return set("showFormatError", action.status, state);
    }
    case SET_FORMAT_OPTIONS: {
        return set("newService.supportedFormats", action.formats, set("newService.formatUrlUsed", action.url, state));
    }
    case NEW_SERVICE_STATUS: {
        return set("isNewServiceAdded", action.status, state);
    }
    case SET_CREDENTIALS: {
        const newService = action.protectedService;
        const newState = set("newService", newService, state);
        return newState;
    }
    case CLEAR_SECURITY: {
        const id = action.protectedId;
        const services = Object.keys(state.services).reduce((p, service) => {
            const item = state.services[service];
            const newItem = item?.protectedId === id ? {
                ...item,
                protectedId: undefined
            } : item;
            return {
                ...p,
                [service]: newItem};
        }, {});
        const newState = set("services", services, state);
        return newState;
    }
    default:
        return state;
    }
}

export default catalog;
