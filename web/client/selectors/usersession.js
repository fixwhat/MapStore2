/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ConfigUtils from '../utils/ConfigUtils';
import { createSelector } from "reselect";
import { contextResourceSelector, userPluginsSelector } from "./context";
import { userSelector } from "./security";

import { mapIdSelector } from "./mapInitialConfig";
import {  mapSaveSelector } from './mapsave';

export const userSessionIdSelector = (state) => state.usersession && state.usersession.id || null;
export const userSessionSelector = (state) => state.usersession && state.usersession.session || null;

export const userSessionToSaveSelector = createSelector(
    [

        userPluginsSelector,
        mapSaveSelector
    ],

    (userPlugins, mapSave) => {
        // Using mapSaveSelector to add all config like saving map
        const newConfig = {
            ...mapSave,
            context: {
                userPlugins
            }
        };
        return newConfig;
    });

const getMapName = (contextId, mapId) => {
    if (ConfigUtils.getConfigProp("userSessions")?.contextOnly) {
        return (contextId ?? "default");
    }
    return (contextId ?? "default") + (mapId ? "." + mapId : "");
};

export const userSessionEnabledSelector = (state) =>
    (ConfigUtils.getConfigProp("userSessions")?.enabled && userSelector(state)?.name) && true || false;
export const userSessionSaveFrequencySelector = () =>
    ConfigUtils.getConfigProp("userSessions")?.saveFrequency ?? 5 * 1000;
export const userSessionBackupFrequencySelector = () =>
    ConfigUtils.getConfigProp("userSessions")?.backupFrequency ?? 6;
export const originalConfigSelector = state => state?.usersession?.config;

export const isAutoSaveEnabled = state => state?.usersession?.autoSave;
export const buildSessionName = (contextId, mapId, userName) =>
    getMapName(contextId, mapId) + "." + userName;

export const userSessionNameSelector = createSelector([
    contextResourceSelector,
    mapIdSelector,
    userSelector
], (context, mapId, user) => buildSessionName(context?.id, mapId, user?.name));

export const checkedSessionToClear = (state) => state?.usersession?.checkedSessionToClear;

