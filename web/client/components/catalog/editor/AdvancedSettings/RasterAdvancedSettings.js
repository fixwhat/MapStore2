/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, {useEffect} from 'react';
import { FormGroup, ControlLabel, Checkbox, Button as ButtonRB, Glyphicon, InputGroup, Tooltip } from "react-bootstrap";
import RS from 'react-select';
import {isNil, camelCase} from "lodash";

import localizedProps from '../../../misc/enhancers/localizedProps';
import CommonAdvancedSettings from './CommonAdvancedSettings';
import ReactQuill from '../../../../libs/quill/react-quill-suspense';
import { ServerTypes } from '../../../../utils/LayersUtils';
import InfoPopover from '../../../widgets/widget/InfoPopover';
import CSWFilters from "./CSWFilters";
import Message from "../../../I18N/Message";
import WMSDomainAliases from "./WMSDomainAliases";
import tooltip from '../../../misc/enhancers/buttonTooltip';
import OverlayTrigger from '../../../misc/OverlayTrigger';
import FormControl from '../../../misc/DebouncedFormControl';

const Button = tooltip(ButtonRB);
const Select = localizedProps('noResultsText')(RS);

/**
 * Generates an array of options in the form e.g. [{value: "256", label: "256x256"}]
 * @param {number[]} opts an array of tile sizes
 */
const getTileSizeSelectOptions = (opts) => {
    return opts.map(opt => ({label: `${opt}x${opt}`, value: opt}));
};
const getServerTypeOptions = () => {
    return Object.keys(ServerTypes).map((key) => ({ label: <Message msgId={`layerProperties.serverTypeOption.${camelCase(key)}`} />, value: ServerTypes[key] }));
};

/**
 * Raster advanced settings form, used by WMS/CSW
 *
 * **WMS**
 * - localizedLayerStyles: Option if `enabled` allows to include the MapStore's locale in each `GetMap`, `GetLegendGraphic` and `GetFeatureInfo` requests to the server so that the WMS server,
 *  if properly configured, can use that locale. For more info [Localized Style](https://mapstore.readthedocs.io/en/latest/user-guide/catalog/#wmswmts-catalog)
 * - autoSetVisibilityLimits: Option allows to fetch and set visibility limits of the layer from GetCapabilities
 *
 * **CSW**
 * - excludeShowTemplate: Configuration if set to false, displays `metadata template` configurable option
 *  * showTemplate: Options allows the user to insert layer description text with metadata information. For more info [Show metadata template](https://mapstore.readthedocs.io/en/latest/user-guide/catalog/#metadata-templates)
 * - Filters (Option allows user to configure the ogcFilter with custom filtering conditions
 *   *staticFilter: filter to fetch all record applied always i.e even when no search text is present
 *   *dynamicFilter: filter when search text is present and is applied in conjunction with static filter
 * - sortBy: Configure sort by operation using the propert name (with namespace prefixed) and the sort order. By default the sort order is 'ASC'
 *
 * **WMS|CSW**
 * - tileSize: Option allows to select and configure the default tile size of the layer to be requested with
 * - serverType: Option allows to specify whether some geoserver vendor options can be used or should be avoided
 * - format: Option allows to select and configure the default format of the layer to be requested with
 * - autoload: Option allows automatic fetching of the results upon selecting the service from Service dropdown
 * - hideThumbnail: Options allows to hide the thumbnail on the result
 *
 */
export default ({
    showFormatError,
    service,
    formatOptions = [],
    infoFormatOptions = [],
    onChangeServiceFormat = () => { },
    onChangeServiceProperty = () => {},
    currentWMSCatalogLayerSize,
    selectedService,
    onFormatOptionsFetch = () => {},
    advancedRasterSettingsStyles = {},
    tileSizeOptions = [256, 512],
    isLocalizedLayerStylesEnabled,
    onChangeMetadataTemplate = () => { },
    onToggleTemplate = () => { },
    ...props
}) => {
    useEffect(() => {
        // Apply default configuration on new service
        service.isNew && onChangeServiceProperty("autoSetVisibilityLimits", props.autoSetVisibilityLimits);
    }, [props.autoSetVisibilityLimits]);

    const tileSelectOptions = getTileSizeSelectOptions(tileSizeOptions);
    const serverTypeOptions = getServerTypeOptions();
    // for CSW services with no vendor options, disable format and info format options
    const canLoadInfo = !(['csw'].includes(service.type) && service.layerOptions?.serverType === ServerTypes.NO_VENDOR);
    return (<CommonAdvancedSettings {...props} onChangeServiceProperty={onChangeServiceProperty} service={service} >
        {(isLocalizedLayerStylesEnabled && !isNil(service.type) ? service.type === "wms" : false) && (<FormGroup controlId="localized-styles" key="localized-styles">
            <Checkbox data-qa="service-lacalized-layer-styles-option"
                onChange={(e) => onChangeServiceProperty("localizedLayerStyles", e.target.checked)}
                checked={!isNil(service.localizedLayerStyles) ? service.localizedLayerStyles : false}>
                <Message msgId="catalog.enableLocalizedLayerStyles.label" />&nbsp;<InfoPopover text={<Message msgId="catalog.enableLocalizedLayerStyles.tooltip" />} />
            </Checkbox>
        </FormGroup>)}
        <FormGroup controlId="autoSetVisibilityLimits" key="autoSetVisibilityLimits">
            <Checkbox
                onChange={(e) => onChangeServiceProperty("autoSetVisibilityLimits", e.target.checked)}
                checked={!isNil(service.autoSetVisibilityLimits) ? service.autoSetVisibilityLimits : false}>
                <Message msgId="catalog.autoSetVisibilityLimits.label" />&nbsp;<InfoPopover text={<Message msgId="catalog.autoSetVisibilityLimits.tooltip" />} />
            </Checkbox>
        </FormGroup>
        {!isNil(service.type) && service.type === "wms" && <FormGroup controlId="singleTile" key="singleTile">
            <Checkbox
                onChange={(e) => onChangeServiceProperty("layerOptions", { ...service.layerOptions, singleTile: e.target.checked })}
                checked={!isNil(service?.layerOptions?.singleTile) ? service.layerOptions.singleTile : false}>
                <Message msgId="layerProperties.singleTile" />&nbsp;<InfoPopover text={<Message msgId="catalog.singleTile.tooltip" />} />
            </Checkbox>
        </FormGroup>}
        {(!isNil(service.type) ? (service.type === "csw" && !service.excludeShowTemplate) : false) && (<FormGroup controlId="metadata-template" key="metadata-template" className="metadata-template-editor">
            <Checkbox
                onChange={() => onToggleTemplate()}
                checked={service && service.showTemplate}>
                <Message msgId="catalog.showTemplate" />
            </Checkbox>
            <br />
            {service && service.showTemplate &&
            (<div>
                <span>
                    <p>
                        <Message msgId="layerProperties.templateFormatInfoAlert2" msgParams={{ attribute: "{ }" }} />
                            &nbsp;&nbsp;

                    </p>
                    <pre>
                        <Message msgId="catalog.templateFormatDescriptionExample" />{" ${ description }"}
                    </pre>
                </span>
            </div>)}
            <div>
                {service && service.showTemplate && <ReactQuill
                    modules={{
                        toolbar: [
                            [{ "size": ["small", false, "large", "huge"] }, "bold", "italic", "underline", "blockquote"],
                            [{ "list": "bullet" }, { "align": [] }],
                            [{ "color": [] }, { "background": [] }, "clean"], ["link"]
                        ]
                    }}
                    value={service.metadataTemplate || ""}
                    onChange={(metadataTemplate) => {
                        if (metadataTemplate && metadataTemplate !== "<p><br></p>") {
                            onChangeMetadataTemplate(metadataTemplate);
                        } else {
                            // TODO think about this
                            onChangeMetadataTemplate("");
                        }
                    }} />
                }
            </div>
        </FormGroup>)}
        <FormGroup style={advancedRasterSettingsStyles}  className="form-group-flex">
            <ControlLabel className="strong"><Message msgId="layerProperties.serverType" /></ControlLabel>
            <InputGroup>
                <Select
                    value={service.layerOptions?.serverType}
                    options={serverTypeOptions}
                    onChange={event => {
                        if (event?.value === ServerTypes.NO_VENDOR) onChangeServiceProperty("layerOptions", { ...service.layerOptions, enableInteractiveLegend: undefined});
                        onChangeServiceProperty("layerOptions", { ...service.layerOptions, serverType: event?.value });
                    }} />
            </InputGroup>
        </FormGroup>
        {![ServerTypes.NO_VENDOR].includes(service.layerOptions?.serverType) && ['wms', 'csw'].includes(service.type) && <FormGroup controlId="enableInteractiveLegend" key="enableInteractiveLegend">
            <Checkbox data-qa="display-interactive-legend-option"
                onChange={(e) => onChangeServiceProperty("layerOptions", { ...service.layerOptions, enableInteractiveLegend: e.target.checked})}
                checked={!isNil(service.layerOptions?.enableInteractiveLegend) ? service.layerOptions?.enableInteractiveLegend : false}>
                <Message msgId="layerProperties.enableInteractiveLegendInfo.label" />
                &nbsp;<InfoPopover text={<Message msgId="layerProperties.enableInteractiveLegendInfo.info" />} />
            </Checkbox>
        </FormGroup>}
        {![ServerTypes.NO_VENDOR].includes(service.layerOptions?.serverType) && service.type === "wms" &&  <FormGroup controlId="useCacheOption" key="useCacheOption">
            <Checkbox data-qa="display-interactive-legend-option"
                onChange={(e) => onChangeServiceProperty("layerOptions", { ...service.layerOptions, remoteTileGrids: e.target.checked})}
                checked={!isNil(service.layerOptions?.remoteTileGrids) ? service.layerOptions?.remoteTileGrids : false}>
                <Message msgId="layerProperties.useCacheOptionInfo.label" />
                &nbsp;<InfoPopover text={<Message msgId="layerProperties.useCacheOptionInfo.info" />} />
            </Checkbox>
        </FormGroup>}
        <hr style={{margin: "8px 0"}}/>
        <FormGroup style={advancedRasterSettingsStyles} className="form-group-flex">
            <ControlLabel className="strong"><Message msgId="layerProperties.format.title" /></ControlLabel>
            <div className="format-toolbar">
                {showFormatError ? <InfoPopover
                    bsStyle="danger"
                    placement="top"
                    showOnRender
                    title={<Message msgId="errorTitleDefault"/>}
                    text={<Message msgId="layerProperties.formatError" />} /> : null}
                <Button
                    disabled={props.formatsLoading || !canLoadInfo
                    }
                    tooltipId="catalog.format.refresh"
                    className="square-button-md no-border"
                    onClick={() => onFormatOptionsFetch(service.url, true)}
                    key="format-refresh">
                    <Glyphicon glyph="refresh" />
                </Button>
            </div>
        </FormGroup>
        <FormGroup style={advancedRasterSettingsStyles} className="form-group-flex">
            <ControlLabel><Message msgId="layerProperties.format.tile" /></ControlLabel>
            <InputGroup>
                <Select
                    disabled={!canLoadInfo}
                    isLoading={props.formatsLoading}
                    onOpen={() => onFormatOptionsFetch(service.url)}
                    value={service && service.format}
                    clearable
                    noResultsText={props.formatsLoading
                        ? "catalog.format.loading" : "catalog.format.noOption"}
                    options={props.formatsLoading ? [] : formatOptions.map((format) => format?.value ? format : ({ value: format, label: format }))}
                    onChange={event => onChangeServiceFormat(event && event.value)} />
            </InputGroup>
        </FormGroup>
        <FormGroup style={advancedRasterSettingsStyles} className="form-group-flex">
            <ControlLabel><Message msgId="layerProperties.format.information" /></ControlLabel>
            <InputGroup>
                <Select
                    disabled={!canLoadInfo}
                    isLoading={props.formatsLoading}
                    onOpen={() => onFormatOptionsFetch(service.url)}
                    value={service && service.infoFormat}
                    clearable
                    options={props.formatsLoading ? [] : infoFormatOptions.map((format) => ({ value: format, label: format }))}
                    onChange={event => onChangeServiceProperty("infoFormat", event && event.value)} />
            </InputGroup>
        </FormGroup>
        <hr style={{margin: "8px 0"}}/>
        <FormGroup style={advancedRasterSettingsStyles} className="form-group-flex">
            <ControlLabel className="strong"><Message msgId="layerProperties.wmsLayerTileSize" /></ControlLabel>
            <InputGroup>
                <Select
                    value={getTileSizeSelectOptions([service.layerOptions?.tileSize || 256])[0]}
                    options={tileSelectOptions}
                    onChange={event => onChangeServiceProperty("layerOptions", { ...service.layerOptions, tileSize: event && event.value })} />
            </InputGroup>
        </FormGroup>

        {!isNil(service.type) && service.type === "csw" &&
        <>
            <hr style={{margin: "8px 0"}}/>
            <FormGroup className="form-group-flex sort-by">
                <ControlLabel className="strong" style={{ display: 'flex', alignItems: "center" }}>
                    <Message msgId="catalog.sortBy.label" />
                    <OverlayTrigger placement={"bottom"} overlay={<Tooltip id={"sortby"}>
                        <Message msgId={"catalog.sortBy.tooltip"} />
                    </Tooltip>}>
                        <Glyphicon
                            style={{ marginLeft: 4 }}
                            glyph={"info-sign"}
                        />
                    </OverlayTrigger>
                </ControlLabel>
                <InputGroup style={{display: "flex"}}>
                    <FormControl
                        type="text"
                        placeholder={"catalog.sortBy.placeholder"}
                        style={{ textOverflow: "ellipsis", flex: 1.5 }}
                        value={service?.sortBy?.name}
                        onChange={value => onChangeServiceProperty("sortBy", {...service?.sortBy, name: value})}
                    />
                    <Select
                        clearable={false}
                        wrapperStyle={{ flex: 1 }}
                        value={service?.sortBy?.order ?? "ASC"}
                        options={["ASC", "DESC"].map(value => ({value, label: value}))}
                        onChange={event => onChangeServiceProperty("sortBy", {...service?.sortBy, order: event && event.value})} />
                </InputGroup>
            </FormGroup>
            <CSWFilters filter={service?.filter} onChangeServiceProperty={onChangeServiceProperty}/>
        </>}
        {!isNil(service.type) && service.type === "wms" && (<WMSDomainAliases service={service} onChangeServiceProperty={onChangeServiceProperty} />)}
    </CommonAdvancedSettings>);
};
