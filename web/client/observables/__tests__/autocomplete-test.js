/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';

import React from 'react';
import ReactDOM from 'react-dom';
import { isEmpty } from 'lodash';

import {
    createPagedUniqueAutompleteStream,
    singleAttributeFilter,
    createWFSFetchStream,
    createCustomPagedUniqueAutompleteStream
} from '../autocomplete';

import AutocompleteEditor from '../../components/data/featuregrid/editors/AutocompleteEditor';
import { AutocompleteWFSCombobox } from '../../components/misc/AutocompleteWFSCombobox';
import rxjsConfig from 'recompose/rxjsObservableConfig';
import { setObservableConfig, mapPropsStreamWithConfig } from 'recompose';
setObservableConfig(rxjsConfig);
const mapPropsStream = mapPropsStreamWithConfig(rxjsConfig);
const props = {
    attribute: "STATE_NAME",
    performFetch: false,
    typeName: "topp:states",
    maxFeatures: 5,
    currentPage: 1,
    value: "",
    url: "base/web/client/test-resources/wps/pageUniqueResponse.json",
    delayDebounce: 0
};
describe('\nAutocomplete Observables', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });

    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById("container"));
        document.body.innerHTML = '';
        setTimeout(done);
    });

    it('test with fake stream, performFetch=false', (done) => {
        const ReactItem = mapPropsStream(props$ =>
            createPagedUniqueAutompleteStream(props$).map(p => {
                if (!isEmpty(p) && p.fetchedData !== undefined) {
                    expect(p.fetchedData.values.length).toBe(0);
                    expect(p.fetchedData.size).toBe(0);
                    expect(p.busy).toBe(false);
                    done();
                }
            })
        )(AutocompleteEditor);
        const item = ReactDOM.render(<ReactItem {...Object.assign({}, props)}/>, document.getElementById("container"));
        expect(item).toExist();
    });

    it('test with fake stream, performFetch=true', (done) => {
        const ReactItem = mapPropsStream(props$ =>
            createPagedUniqueAutompleteStream(props$).map(p => {
                if (!isEmpty(p) && p.fetchedData !== undefined ) {
                    expect(p.fetchedData.values.length).toBe(2);
                    expect(p.fetchedData.values[0]).toBe("value1");
                    expect(p.fetchedData.size).toBe(2);
                    expect(p.busy).toBe(false);
                    done();
                }
            })
        )(AutocompleteEditor);
        const item = ReactDOM.render(<ReactItem {...Object.assign({}, props, {performFetch: true})}/>, document.getElementById("container"));
        expect(item).toExist();
    });

    it('test a failure case intercepted into catch statement ', (done) => {
        const ReactItem = mapPropsStream(props$ =>
            createPagedUniqueAutompleteStream(props$).map(p => {
                if (!isEmpty(p) && p.fetchedData !== undefined ) {
                    expect(p.fetchedData.values.length).toBe(0);
                    expect(p.fetchedData.size).toBe(0);
                    expect(p.busy).toBe(false);
                    done();
                }
            })
        )(AutocompleteEditor);
        const item = ReactDOM.render(<ReactItem {...Object.assign({}, props, {performFetch: true, url: "wrong"})}/>, document.getElementById("container"));
        expect(item).toExist();
    });

    it('test with fake createWFSFetchStream, performFetch=true', (done) => {
        const ReactItem = mapPropsStream(props$ =>
            createWFSFetchStream(props$).map(p => {
                if (!isEmpty(p) && p.fetchedData !== undefined ) {
                    expect(p.fetchedData.values.length).toBe(2);
                    expect(p.fetchedData.values[0].name).toBe("name ft 1");
                    expect(p.fetchedData.size).toBe(2);
                    expect(p.fetchedData.features.length).toBe(2);
                    expect(p.busy).toBe(false);
                    done();
                }
            })
        )(() => <AutocompleteWFSCombobox autocompleteStreamFactory={createWFSFetchStream}/>);
        const item = ReactDOM.render(<ReactItem {...Object.assign({}, {
            url: "base/web/client/test-resources/wps/pageUniqueResponse.jsonwfs",
            "filterProps": {
                "blacklist": [],
                "maxFeatures": 5,
                "predicate": "LIKE",
                "queriableAttributes": ["STATE_NAME"],
                "typeName": "topp:states",
                "valueField": "STATE_NAME",
                "returnFullData": true
            },
            value: "searchText",
            performFetch: true})}/>, document.getElementById("container"));
        expect(item).toExist();
    });
    it('test with fake createWFSFetchStream, performFetch=false', (done) => {
        const ReactItem = mapPropsStream(props$ =>
            createWFSFetchStream(props$).map(p => {
                if (!isEmpty(p) && p.fetchedData !== undefined ) {
                    expect(p.fetchedData.values.length).toBe(0);
                    expect(p.fetchedData.size).toBe(0);
                    expect(p.fetchedData.features.length).toBe(0);
                    expect(p.busy).toBe(false);
                    done();
                }
            })
        )(() => <AutocompleteWFSCombobox autocompleteStreamFactory={createWFSFetchStream}/>);
        const item = ReactDOM.render(<ReactItem {...Object.assign({}, {
            url: "base/web/client/test-resources/wps/pageUniqueResponse.jsonwfs",
            "filterProps": {
                "blacklist": [],
                "maxFeatures": 5,
                "predicate": "LIKE",
                "queriableAttributes": ["STATE_NAME"],
                "typeName": "topp:states",
                "valueField": "STATE_NAME",
                "returnFullData": true
            },
            value: "searchText",
            performFetch: false})}/>, document.getElementById("container"));
        expect(item).toExist();
    });
    it("test singleAttributeFilter NAME LIKE '%montana%'", () => {
        const searchText = "montana";
        const queriableAttributes = ["NAME"];
        const predicate = "LIKE";
        const filter = singleAttributeFilter({searchText, queriableAttributes, predicate});
        expect(filter).toExist();
        expect(filter).toBe("(strToLowerCase(NAME) LIKE '%montana%')");
    });
    it("test singleAttributeFilter empty queriable attributes, returns empty string", () => {
        const filter = singleAttributeFilter({});
        expect(filter).toBe("");
    });
    it('test createCustomPagedUniqueAutompleteStream with fake stream, filterProps not a prop', (done) => {
        const ReactItem = mapPropsStream(props$ =>
            createCustomPagedUniqueAutompleteStream(props$).map(p => {
                if (!isEmpty(p) && p.fetchedData !== undefined) {
                    expect(p.fetchedData.values.length).toBe(0);
                    expect(p.fetchedData.size).toBe(0);
                    expect(p.busy).toBe(false);
                    done();
                }
            })
        )(AutocompleteEditor);
        const item = ReactDOM.render(<ReactItem {...Object.assign({}, props)}/>, document.getElementById("container"));
        expect(item).toExist();
    });

    it('test createCustomPagedUniqueAutompleteStream with fake stream, filterProps is a prop', (done) => {
        const ReactItem = mapPropsStream(props$ =>
            createCustomPagedUniqueAutompleteStream(props$).map(p => {
                if (!isEmpty(p) && p.fetchedData !== undefined ) {
                    expect(p.fetchedData.values.length).toBe(2);
                    expect(p.fetchedData.values[0]).toBe("value1");
                    expect(p.fetchedData.size).toBe(2);
                    expect(p.busy).toBe(false);
                    done();
                }
            })
        )(AutocompleteEditor);
        const item = ReactDOM.render(<ReactItem {...Object.assign({}, props, {filterProps: {
            "blacklist": [],
            "maxFeatures": 3,
            "queriableAttributes": ["COMUNE"],
            "predicate": "ILIKE",
            "typeName": "test:Linea_costa"
        }})}/>, document.getElementById("container"));
        expect(item).toExist();
    });

    it('test a failure case intercepted into catch statement with createCustomPagedUniqueAutompleteStream', (done) => {
        const ReactItem = mapPropsStream(props$ =>
            createCustomPagedUniqueAutompleteStream(props$).map(p => {
                if (!isEmpty(p) && p.fetchedData !== undefined ) {
                    expect(p.fetchedData.values.length).toBe(0);
                    expect(p.fetchedData.size).toBe(0);
                    expect(p.busy).toBe(false);
                    done();
                }
            })
        )(AutocompleteEditor);
        const item = ReactDOM.render(<ReactItem {...Object.assign({}, props, {url: "wrong"}, {filterProps: {
            "blacklist": [],
            "maxFeatures": 3,
            "queriableAttributes": ["COMUNE"],
            "predicate": "ILIKE",
            "typeName": "test:Linea_costa"
        }})}/>, document.getElementById("container"));
        expect(item).toExist();
    });
});
