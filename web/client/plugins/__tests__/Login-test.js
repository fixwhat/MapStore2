/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import expect from 'expect';
import Rx from 'rxjs';

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';


import Login from '../Login';
import OmniBar from '../OmniBar';
import SidebarMenu from '../SidebarMenu';

import { getPluginForTest } from './pluginsTestUtils';
import { createStateMocker } from '../../reducers/__tests__/reducersTestUtils';

import controls from '../../reducers/controls';
import security from '../../reducers/security';

import {loginSuccess, LOGOUT} from '../../actions/security';

import { toggleControl, setControlProperty, SET_CONTROL_PROPERTY } from '../../actions/controls';

import ConfigUtils from '../../utils/ConfigUtils';

describe('Login Plugin', () => {
    const stateMocker = createStateMocker({ controls, security });
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });

    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById("container"));
        document.body.innerHTML = '';
        setTimeout(done);
    });
    describe('Login', () => {
        it('default render', () => {
            const storeState = stateMocker();
            const { Plugin } = getPluginForTest(Login, storeState);
            ReactDOM.render(<Plugin />, document.getElementById("container"));
            expect(document.querySelector('#mapstore-login-menu')).toBeTruthy();
            // permission table present by default
            expect(document.querySelector('.modal-dialog')).toBeFalsy();
        });
        it('show login modal from external action', () => {
            const storeState = stateMocker(toggleControl('LoginForm', 'enabled'));
            const { Plugin } = getPluginForTest(Login, storeState);
            ReactDOM.render(<Plugin />, document.getElementById("container"));
            expect(document.querySelector('#mapstore-login-menu')).toBeTruthy();
            // permission table present by default
            expect(document.querySelector('.modal-dialog')).toBeTruthy();
        });
        it('show login modal on click', () => {
            const storeState = stateMocker();
            const { Plugin } = getPluginForTest(Login, storeState);
            ReactDOM.render(<Plugin />, document.getElementById("container"));
            TestUtils.Simulate.click(document.querySelector('.glyphicon-log-in'));
            expect(document.querySelector('#mapstore-login-menu')).toBeTruthy();
            // permission table present by default
            expect(document.querySelector('.modal-dialog')).toBeTruthy();
        });

        it('render in OmniBar', () => {
            const storeState = stateMocker();
            // const { Plugin } = getPluginForTest(Login, storeState);
            const { Plugin: OmniBarPlugin } = getPluginForTest(OmniBar, storeState, { LoginPlugin: Login });
            ReactDOM.render(<OmniBarPlugin items={[{ ...Login.LoginPlugin.OmniBar, plugin: Plugin.LoginPlugin}]} />, document.getElementById("container"));
            expect(document.querySelector('#mapstore-navbar-container .glyphicon-user')).toBeTruthy();
        });
        it('confirm dialog on pending changes', done => {
            const storeState = stateMocker(
                loginSuccess({  User: { name: "Test", access_token: "some-token"}}),
                setControlProperty('unsavedMap', 'enabled', true),
                setControlProperty('unsavedMap', 'source', 'logout')
            );
            const { PluginImpl } = getPluginForTest(Login, storeState);
            const { Plugin: OmniBarPlugin } = getPluginForTest(OmniBar, storeState, { LoginPlugin: Login }, [
                actions$ => actions$.ofType(LOGOUT).switchMap(({redirectUrl})=> {
                    // test the confirm button click event causes logout action.
                    expect(redirectUrl).toBeFalsy();
                    done();
                    return  Rx.Observable.empty();
                })
            ], { security, controls });
            ReactDOM.render(<OmniBarPlugin items={[{ ...PluginImpl.OmniBar, plugin: PluginImpl}]} />, document.getElementById("container"));
            expect(document.querySelector('#mapstore-navbar-container .glyphicon-user')).toBeTruthy();
            // show modal
            expect(document.querySelector('.ms-resizable-modal')).toExist();
            const buttons = document.querySelectorAll('.ms-resizable-modal .modal-footer button');
            expect(buttons[0]).toBeTruthy();
            expect(buttons[1]).toBeTruthy();
            // click on confirm button
            TestUtils.Simulate.click(buttons[0]);
        });
        it('not confirm closes dialog', done => {
            const storeState = stateMocker(
                loginSuccess({ User: { name: "Test", access_token: "some-token" } }),
                setControlProperty('unsavedMap', 'enabled', true),
                setControlProperty('unsavedMap', 'source', 'logout')
                // TODO: not sure about why this is required, investigate.
            );
            const { PluginImpl } = getPluginForTest(Login, storeState);
            const { Plugin: OmniBarPlugin } = getPluginForTest(OmniBar, storeState, { LoginPlugin: Login }, [
                actions$ => actions$.ofType(SET_CONTROL_PROPERTY).switchMap(({ control, property, value }) => {
                    // test the cancel  button click event causes modal close
                    expect(control).toEqual('unsavedMap');
                    expect(property).toEqual('enabled');
                    expect(value).toEqual(false);
                    done();
                    return Rx.Observable.empty();
                })
            ], { security, controls });
            ReactDOM.render(<OmniBarPlugin items={[{ ...PluginImpl.OmniBar, plugin: PluginImpl }]} />, document.getElementById("container"));
            expect(document.querySelector('#mapstore-navbar-container .glyphicon-user')).toBeTruthy();
            // show modal
            expect(document.querySelector('.ms-resizable-modal')).toExist();
            const buttons = document.querySelectorAll('.ms-resizable-modal .modal-footer button');
            expect(buttons[0]).toBeTruthy();
            expect(buttons[1]).toBeTruthy();
            // click on confirm button
            TestUtils.Simulate.click(buttons[1]);
        });
        it('test hide change password in case LDAP user [not admin] ', () => {
            const storeState = stateMocker(toggleControl('LoginForm', 'enabled'), loginSuccess({  User: { name: "Test", access_token: "some-token", role: 'USER' }}) );
            const { Plugin } = getPluginForTest(Login, storeState);
            TestUtils.act(()=>{
                ReactDOM.render(<Plugin isUsingLDAP displayName="name" />, document.getElementById("container"));
            });
            expect(document.querySelector('#mapstore-login-menu .glyphicon-user')).toBeTruthy();
            const entries = document.querySelectorAll("#mapstore-login-menu ~ ul li[role=\"presentation\"]");
            expect(entries.length).toEqual(2);
            expect([...entries].map(entry => entry.innerText)).toEqual(['user.info', 'user.logout']);
        });
        it('test show change password in case LDAP user [admin] ', () => {
            const storeState = stateMocker(toggleControl('LoginForm', 'enabled'), loginSuccess({  User: { name: "Test", access_token: "some-token", role: 'ADMIN' }}) );
            const { Plugin } = getPluginForTest(Login, storeState);
            ReactDOM.render(<Plugin isUsingLDAP displayName="name"  />, document.getElementById("container"));
            expect(document.querySelector('#mapstore-login-menu .glyphicon-user')).toBeTruthy();
            const entries = document.querySelectorAll("#mapstore-login-menu ~ ul li[role=\"presentation\"]");
            expect(entries.length).toEqual(6);
            expect([...entries].map(entry => entry.innerText)).toEqual(['user.info', 'user.changePwd', 'users.title', 'usergroups.title', 'resourcesCatalog.manageTags', 'user.logout']);
        });
        it('test show change password in case ms user ', () => {
            const storeState = stateMocker(toggleControl('LoginForm', 'enabled'), loginSuccess({  User: { name: "Test", access_token: "some-token", role: 'USER' }}) );
            const { Plugin } = getPluginForTest(Login, storeState);
            ReactDOM.render(<Plugin />, document.getElementById("container"));
            expect(document.querySelector('#mapstore-login-menu .glyphicon-user')).toBeTruthy();
            const entries = document.querySelectorAll("#mapstore-login-menu ~ ul li[role=\"presentation\"]");
            expect(entries.length).toEqual(3);
            expect([...entries].map(entry => entry.innerText)).toEqual(['user.info', 'user.changePwd', 'user.logout']);
        });
    });
    describe('OmniBar menu entries', () => {
        afterEach(() => {
            ConfigUtils.setConfigProp("authenticationProviders", undefined);
        });
        it('default', () => {
            const storeState = stateMocker(toggleControl('LoginForm', 'enabled'), loginSuccess({  User: { name: "Test", access_token: "some-token" }}) );
            const { Plugin } = getPluginForTest(Login, storeState);
            const { Plugin: OmniBarPlugin } = getPluginForTest(OmniBar, storeState, { LoginPlugin: Login });
            ReactDOM.render(<OmniBarPlugin items={[{ ...Login.LoginPlugin.OmniBar, plugin: Plugin.LoginPlugin}]} />, document.getElementById("container"));
            expect(document.querySelector('#mapstore-navbar-container .glyphicon-user')).toBeTruthy();
            const entries = document.querySelectorAll("#mapstore-navbar-container ul li[role=\"presentation\"]");
            expect(entries.length).toEqual(3); // user.info, user.changePwd, user.logout
        });
        it('openID', () => {
            ConfigUtils.setConfigProp("authenticationProviders", [{type: "openID", provider: "google"}]);
            const storeState = stateMocker(toggleControl('LoginForm', 'enabled'), loginSuccess({  User: { name: "Test", access_token: "some-token" }, authProvider: "google"}) );
            const { Plugin } = getPluginForTest(Login, storeState);
            const { Plugin: OmniBarPlugin } = getPluginForTest(OmniBar, storeState, { LoginPlugin: Login });
            ReactDOM.render(<OmniBarPlugin items={[{ ...Login.LoginPlugin.OmniBar, plugin: Plugin.LoginPlugin}]} />, document.getElementById("container"));
            expect(document.querySelector('#mapstore-navbar-container .glyphicon-user')).toBeTruthy();
            const entries = document.querySelectorAll("#mapstore-navbar-container ul li[role=\"presentation\"]");
            expect(entries.length).toEqual(1); // only user.logout
        });
        it('openID automatic login is mapped when 1 provider only is present', () => {
            const spyOn = {
                goToPage: () => {}
            };
            expect.spyOn(spyOn, 'goToPage');
            ConfigUtils.setConfigProp("authenticationProviders", [{type: "openID", provider: "oidc", goToPage: spyOn.goToPage}]); // goToPage is normally empty, but can be used to mock the redirect in tests

            const { Plugin } = getPluginForTest(Login, {});
            const { Plugin: OmniBarPlugin } = getPluginForTest(OmniBar, {}, { LoginPlugin: Login });
            TestUtils.act(() => {
                ReactDOM.render(<OmniBarPlugin items={[{ ...Login.LoginPlugin.OmniBar, plugin: Plugin.LoginPlugin}]} />, document.getElementById("container"));
            });
            document.querySelector("#mapstore-navbar-container > div > ul > li > a").click();
            expect(spyOn.goToPage).toHaveBeenCalled();
            expect(spyOn.goToPage.calls[0].arguments[0]).toEqual(`/rest/geostore/openid/oidc/login`);
        });
        it('openID with userInfo configured', () => {
            ConfigUtils.setConfigProp("authenticationProviders", [{type: "openID", provider: "google", showAccountInfo: true}]);
            const storeState = stateMocker(toggleControl('LoginForm', 'enabled'), loginSuccess({  User: { name: "Test", access_token: "some-token" }, authProvider: "google"}) );
            const { Plugin } = getPluginForTest(Login, storeState);
            const { Plugin: OmniBarPlugin } = getPluginForTest(OmniBar, storeState, { LoginPlugin: Login });
            ReactDOM.render(<OmniBarPlugin items={[{ ...Login.LoginPlugin.OmniBar, plugin: Plugin.LoginPlugin}]} />, document.getElementById("container"));
            expect(document.querySelector('#mapstore-navbar-container .glyphicon-user')).toBeTruthy();
            const entries = document.querySelectorAll("#mapstore-navbar-container ul li[role=\"presentation\"]");
            expect(entries.length).toEqual(2); // user.info and user.logout
        });
    });
    describe('SidebarMenu menu entries', () => {
        afterEach(() => {
            ConfigUtils.setConfigProp("authenticationProviders", undefined);

        });
        it('default', () => {
            const storeState = stateMocker(toggleControl('LoginForm', 'enabled'), loginSuccess({  User: { name: "Test", access_token: "some-token" }}) );
            const { Plugin } = getPluginForTest(Login, storeState);
            const { Plugin: SidebarMenuPlugin } = getPluginForTest(SidebarMenu, storeState, { LoginPlugin: Login });
            // container div is set to force the login items to render in the sidebar, not using the extra space
            ReactDOM.render(<div style={{position: "relative", height: 500}} ><SidebarMenuPlugin items={[{ ...Login.LoginPlugin.SidebarMenu, plugin: Plugin.LoginPlugin}]} /></div>, document.getElementById("container"));
            const entries = document.querySelectorAll("#mapstore-sidebar-menu ul li[role=\"presentation\"]");
            expect(entries.length).toEqual(3); // user.info, user.changePwd, user.logout
        });
        it('openID', () => {
            ConfigUtils.setConfigProp("authenticationProviders", [{type: "openID", provider: "google"}]);
            const storeState = stateMocker(toggleControl('LoginForm', 'enabled'), loginSuccess({  User: { name: "Test", access_token: "some-token" }, authProvider: "google"}) );
            const { Plugin } = getPluginForTest(Login, storeState);
            const { Plugin: SidebarMenuPlugin } = getPluginForTest(SidebarMenu, storeState, { LoginPlugin: Login });
            // container div is set to force the login items to render in the sidebar, not using the extra space
            ReactDOM.render(<div style={{position: "relative", height: 500}} ><SidebarMenuPlugin items={[{ ...Login.LoginPlugin.SidebarMenu, plugin: Plugin.LoginPlugin}]} /></div>, document.getElementById("container"));
            const entries = document.querySelectorAll("#mapstore-sidebar-menu ul li[role=\"presentation\"]");
            expect(entries.length).toEqual(1); // only user.logout
        });
        it('openID with userInfo configured', () => {
            ConfigUtils.setConfigProp("authenticationProviders", [{type: "openID", provider: "google", showAccountInfo: true}]);
            const storeState = stateMocker(toggleControl('LoginForm', 'enabled'), loginSuccess({  User: { name: "Test", access_token: "some-token" }, authProvider: "google"}) );
            const { Plugin } = getPluginForTest(Login, storeState);
            const { Plugin: SidebarMenuPlugin } = getPluginForTest(SidebarMenu, storeState, { LoginPlugin: Login });
            // container div is set to force the login items to render in the sidebar, not using the extra space
            ReactDOM.render(<div style={{position: "relative", height: 500}} ><SidebarMenuPlugin items={[{ ...Login.LoginPlugin.SidebarMenu, plugin: Plugin.LoginPlugin}]} /></div>, document.getElementById("container"));
            const entries = document.querySelectorAll("#mapstore-sidebar-menu ul li[role=\"presentation\"]");
            expect(entries.length).toEqual(2); // user.info and user.logout
        });
    });

});
