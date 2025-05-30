/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const BASE_URL = "TEST";

import MockAdapter from 'axios-mock-adapter';
import expect from 'expect';
import RULES from 'raw-loader!../../../test-resources/geofence/rest/rules/rules_1.xml';

import axios from '../../../libs/ajax';
import GF_RULE from '../../../test-resources/geofence/rest/rules/full_rule1.json';
import ruleServiceFactory, { cleanConstraints } from '../RuleService';

const RuleService = ruleServiceFactory({
    addBaseUrl: (opts) => ({...opts, baseURL: BASE_URL}),
    getGeoServerInstance: () => ({url: BASE_URL})
});

// const RULES_JSON = require('../../../test-resources/geofence/rest/rules/rules_1.json');


let mockAxios;


describe('RuleService API for GeoFence StandAlone', () => {
    beforeEach(done => {
        mockAxios = new MockAdapter(axios);
        setTimeout(done);
    });

    afterEach(done => {
        mockAxios.restore();
        setTimeout(done);
    });
    it('getRulesCount', (done) => {
        const PARAMS = { roleName: "ADMIN" };
        const EXPECTED_PARAMS = { roleName: "ADMIN", roleNameAny: true };
        mockAxios.onGet().reply(config => {
            expect(config.url).toBe(`/rules/count`);
            expect(config.baseURL).toBe(`${BASE_URL}`);
            expect(config.params).toEqual(EXPECTED_PARAMS);
            return [200, '2'];
        });
        RuleService.getRulesCount(PARAMS)
            .then(v => {
                expect(v).toBe(2);
                done();
            })
            .catch(e => done(e));
    });
    it('getRulesCount with [field]Any param with/without value for its [field]', (done) => {
        const PARAMS = { roleName: "ADMIN", workspaceAny: true, service: "WFS", serviceAny: false };
        const EXPECTED_PARAMS = { roleName: "ADMIN", roleNameAny: true, service: "WFS", serviceAny: false };    // will skip workspaceAny as no value set for workspace + roleNameAny will be true
        mockAxios.onGet().reply(config => {
            expect(config.url).toBe(`/rules/count`);
            expect(config.baseURL).toBe(`${BASE_URL}`);
            expect(config.params).toEqual(EXPECTED_PARAMS);
            return [200, "2"];
        });
        RuleService.getRulesCount(PARAMS)
            .then(v => {
                expect(v).toBe(2);
                done();
            })
            .catch(e => done(e));
    });
    it('loadRules', (done) => {
        const PARAMS = { roleName: "ADMIN" };
        const EXPECTED_PARAMS = { roleName: "ADMIN", roleNameAny: true };
        mockAxios.onGet().reply(config => {
            expect(config.url).toBe(`/rules`);
            expect(config.baseURL).toBe(`${BASE_URL}`);
            expect(config.params).toEqual({...EXPECTED_PARAMS, page: 1, entries: 10});
            return [200, RULES];
        });
        RuleService.loadRules(1, PARAMS, 10).then(v => {
            expect(v.rules).toExist();
            expect(v.rules.length).toBe(7);
            // check the rules are converted in internal format
            expect(v.rules[0].grant).toBe("ALLOW");
            expect(v.rules[2].rolename).toBe("TEST_ROLE");
            done();
        });
    });
    it('loadRules with [field]Any param with/without value for its [field]', (done) => {
        const PARAMS = { roleName: "ADMIN", workspaceAny: true, service: "WFS", serviceAny: false };
        const EXPECTED_PARAMS = { roleName: "ADMIN", roleNameAny: true, service: "WFS", serviceAny: false };    // will skip workspaceAny as no value set for workspace + roleNameAny will be true
        mockAxios.onGet().reply(config => {
            expect(config.url).toBe(`/rules`);
            expect(config.baseURL).toBe(`${BASE_URL}`);
            expect(config.params).toEqual({...EXPECTED_PARAMS, page: 1, entries: 10});
            return [200, RULES];
        });
        RuleService.loadRules(1, PARAMS, 10).then(v => {
            expect(v.rules).toExist();
            expect(v.rules.length).toBe(7);
            // check the rules are converted in internal format
            expect(v.rules[0].grant).toBe("ALLOW");
            expect(v.rules[0].workspace).toBe("WORKSPACE");
            done();
        });
    });
    it('moveRules', (done) => {
        mockAxios.onGet().reply(config => {
            expect(config.url).toBe(`/rules/move`);
            expect(config.baseURL).toBe(`${BASE_URL}`);
            expect(config.params).toEqual({ targetPriority: 1, rulesIds: '1,2' });
            return [200, RULES];
        });
        RuleService.moveRules(1, [{id: 1 }, { id: 2 }]).then(() => {
            done();
        });
    });
    it('addRule', (done) => {
        mockAxios.onPost().reply(config => {
            expect(config.url).toBe(`/rules`);
            expect(config.baseURL).toBe(`${BASE_URL}`);
            expect(config.method).toBe('post');
            const rule = JSON.parse(config.data);
            Object.keys(rule).fill(k => k !== 'constraints').map(k => {
                expect(rule[k]).toEqual(GF_RULE[k]);
            });
            return [200];
        });
        RuleService.addRule(GF_RULE).then(() => {
            done();
        });
    });
    it('deleteRule', (done) => {
        mockAxios.onDelete().reply(config => {
            expect(config.url).toBe(`/rules/id/1`);
            expect(config.baseURL).toBe(`${BASE_URL}`);
            expect(config.method).toBe('delete');
            return [200];
        });
        RuleService.deleteRule(1).then(() => {
            done();
        });
    });
    // TODO: updateRules, cleanCache

    it("test cleanConstraints", () => {
        let rule = {};
        expect(cleanConstraints(rule)).toEqual(rule);
        const grant = "DENY";
        rule = {constraints: "some", grant};
        expect(cleanConstraints(rule)).toEqual({grant});
        rule = {constraints: {allowedStyles: undefined, attributes: null, restrictedAreaWkt: ""}};
        expect(cleanConstraints(rule)).toEqual({constraints: {allowedStyles: [], attributes: [], restrictedAreaWkt: null}});
        rule = {constraints: {allowedStyles: {style: {"color": "#000"}}, attributes: {attribute: [{access: "READONLY", name: "ID"}]}, restrictedAreaWkt: "POLYGON((10 10, 10, 20, 20 20, 20 10, 10 10))"}};
        expect(cleanConstraints(rule)).toEqual({
            constraints: {
                allowedStyles: rule.constraints.allowedStyles.style,
                attributes: rule.constraints.attributes.attribute,
                restrictedAreaWkt: rule.constraints.restrictedAreaWkt
            }
        });
    });
});
