/**
 * Copyright 2015, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
    CHANGE_MAP_VIEW,
    CHANGE_MOUSE_POINTER,
    CHANGE_ZOOM_LVL,
    CHANGE_MAP_CRS,
    CHANGE_MAP_SCALES,
    PAN_TO,
    CHANGE_MAP_STYLE,
    CHANGE_ROTATION,
    UPDATE_VERSION,
    ZOOM_TO_POINT,
    RESIZE_MAP,
    CHANGE_MAP_LIMITS,
    SET_MAP_RESOLUTIONS,
    REGISTER_EVENT_LISTENER,
    UNREGISTER_EVENT_LISTENER,
    ORIENTATION,
    UPDATE_MAP_VIEW,
    UPDATE_MAP_OPTIONS,
    FORCE_RENDER
} from '../actions/map';
import { LOCATION_CHANGE } from 'connected-react-router';

import MapUtils from '../utils/MapUtils';
import CoordinatesUtils from '../utils/CoordinatesUtils';

function mapConfig(state = {eventListeners: {}}, action) {
    switch (action.type) {
    case CHANGE_MAP_VIEW:
        const {type, ...params} = action;
        params.zoom = isNaN(params.zoom) ? 1 : params.zoom;
        return Object.assign({}, state, params);
    case FORCE_RENDER:
        return {...state, center: {...state.center, x: state.center.x + 0.0000000000001}};
    case CHANGE_MOUSE_POINTER:
        return Object.assign({}, state, {
            mousePointer: action.pointer
        });
    case LOCATION_CHANGE:
        if (action?.payload?.action === 'REPLACE') {
            return state;
        }
        return Object.assign({}, {eventListeners: {}});
    case CHANGE_ZOOM_LVL:
        return Object.assign({}, state, {
            zoom: action.zoom,
            mapStateSource: action.mapStateSource
        });
    case CHANGE_MAP_LIMITS:
        return Object.assign({}, state, {
            limits: {
                restrictedExtent: action.restrictedExtent,
                crs: action.crs,
                minZoom: action.minZoom
            }
        });
    case CHANGE_MAP_CRS:
        return Object.assign({}, state, {
            projection: action.crs
        });
    case CHANGE_MAP_SCALES:
        if (action.scales) {
            const dpi = state && state.mapOptions && state.mapOptions.view && state.mapOptions.view.DPI || null;
            const resolutions = MapUtils.getResolutionsForScales(action.scales, state && state.projection || "EPSG:4326", dpi);
            // add or update mapOptions.view.resolutions
            return Object.assign({}, state, {
                mapOptions: Object.assign({}, state && state.mapOptions,
                    {
                        view: Object.assign({}, state && state.mapOptions && state.mapOptions.view, {
                            resolutions: resolutions,
                            scales: action.scales
                        })
                    })
            });
        } else if (state && state.mapOptions && state.mapOptions.view && state.mapOptions.view && state.mapOptions.view.resolutions) {
            // TODO: this block is removing empty objects from the state, check if it really needed
            // deeper clone
            let newState = Object.assign({}, state);
            newState.mapOptions = Object.assign({}, newState.mapOptions);
            newState.mapOptions.view = Object.assign({}, newState.mapOptions.view);
            // remove resolutions
            delete newState.mapOptions.view.resolutions;
            // cleanup state
            if (Object.keys(newState.mapOptions.view).length === 0) {
                delete newState.mapOptions.view;
            }
            if (Object.keys(newState.mapOptions).length === 0) {
                delete newState.mapOptions;
            }
            return newState;
        }
        return state;
    case SET_MAP_RESOLUTIONS: {
        return Object.assign({}, state, {
            resolutions: action.resolutions
        });
    }
    case ZOOM_TO_POINT: {
        return Object.assign({}, state, {
            center: CoordinatesUtils.reproject(action.pos, action.crs, 'EPSG:4326'),
            zoom: action.zoom,
            mapStateSource: null
        });
    }
    case PAN_TO: {
        // action.center now can be also an array (with the coord specified in 4326)
        const center = CoordinatesUtils.reproject(
            action.center,
            action.center.crs || 'EPSG:4326',
            'EPSG:4326');
        return Object.assign({}, state, {
            center,
            mapStateSource: null
        });
    }
    case CHANGE_MAP_STYLE: {
        return Object.assign({}, state, {mapStateSource: action.mapStateSource, style: action.style, resize: state.resize ? state.resize + 1 : 1});
    }
    case RESIZE_MAP: {
        return Object.assign({}, state, {resize: state.resize ? state.resize + 1 : 1});
    }
    case CHANGE_ROTATION: {
        let newBbox = Object.assign({}, state.bbox, {rotation: action.rotation});
        return Object.assign({}, state, {bbox: newBbox, mapStateSource: action.mapStateSource});
    }
    case UPDATE_VERSION: {
        return Object.assign({}, state, {version: action.version});
    }
    case REGISTER_EVENT_LISTENER: {
        return Object.assign({}, state,
            {eventListeners: Object.assign({}, state.eventListeners || {},
                {[action.eventName]: [...(state.eventListeners && state.eventListeners[action.eventName] || []), action.toolName]})});
    }
    case UNREGISTER_EVENT_LISTENER: {
        let data = state;
        if (state?.eventListeners) {
            const filteredEventNameTools = (state.eventListeners && state.eventListeners[action.eventName] || []).filter(tool => tool !== action.toolName) || [];
            data = Object.assign({}, state,
                {eventListeners: Object.assign({}, state.eventListeners,
                    {[action.eventName]: filteredEventNameTools})});
        }
        return data;
    }
    case ORIENTATION: {
        if (action && action.orientation && (action.orientation.center || action.orientation.marker)) {
            const center = action?.orientation?.center?.split(',') || action?.orientation?.marker?.split(',');
            const x = center && center[0];
            const y = center && center[1];
            const z = action.orientation.zoom;
            const heading = action.orientation.heading;
            const pitch = action.orientation.pitch;
            const roll = action.orientation.roll;
            return Object.assign({}, state, {orientate: {x, y, z, heading, pitch, roll}});
        }
        return null;
    }
    case UPDATE_MAP_VIEW:
        const heading = parseFloat(action?.data?.heading);
        const pitch = parseFloat(action?.data?.pitch);
        const roll = parseFloat(action?.data?.roll);
        const zoom = parseFloat(action?.data?.zoom);
        const x = parseFloat(action?.data?.coordinate[0]);
        const y = parseFloat(action?.data?.coordinate[1]);
        return {
            zoom,
            center: {x, y},
            viewerOptions: {
                orientation: {
                    heading, pitch, roll
                }
            }
        };
    case UPDATE_MAP_OPTIONS:
        return {
            ...state,
            mapOptions: {
                ...state.mapOptions,
                ...action.configUpdate
            }
        };
    default:
        return state;
    }
}

export default mapConfig;
