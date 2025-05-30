/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';

import ReactDOM from 'react-dom';
import expect from 'expect';
import Header from '../Header.jsx';
describe('Rules Editor Header component', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });
    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById("container"));
        document.body.innerHTML = '';
        setTimeout(done);
    });
    it('render default buttons and navigation items', () => {
        ReactDOM.render(<Header/>, document.getElementById("container"));
        const container = document.getElementById('container');
        const el = container.querySelector('.ms-panel-header-container');
        expect(el).toExist();
        const btns = el.querySelectorAll('button');
        expect(btns).toExist();
        expect(btns.length).toBe(2);
        const navItems = el.querySelectorAll('.nav.nav-tabs li');
        expect(navItems).toExist();
        expect(navItems.length).toBe(1);

    });
});
