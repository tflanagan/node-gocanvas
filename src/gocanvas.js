/* Copyright 2017 Tristian Flanagan
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

'use strict';

/* Dependencies */
const qs = require('querystring');
const xml = require('xml2js');
const http = require('http');
const https = require('https');
const debug = require('debug');
const merge = require('lodash.merge');
const Promise = require('bluebird');
const cleanXML = require('cleanxml');

/* Debug */
const debugCore = debug('gocanvas:core');
const debugRequest = debug('gocanvas:request');
const debugResponse = debug('gocanvas:response');

/* GoCanvas */
class GoCanvas {

	constructor(options) {
		this.settings = merge({}, GoCanvas.defaults, options || {});

		this._reqNum = 0;

		debugCore('Class initiated', this.settings);

		return this;
	}

	request(localPath, options, querystring, body) {
		if(typeof(localPath) !== 'string'){
			if(localPath instanceof Array){
				localPath = localPath.join('/');
			}else{
				body = options;
				options = localPath;

				localPath = '';
			}
		}

		const reqNum = this._reqNum;
		const path = [
			this.settings.service.path,
			localPath
		].join('/');

		this._reqNum += 1;

		const request = merge({}, this.settings.service, {
			path: path + (querystring ? '?' + qs.stringify(querystring) : ''),
			method: 'GET',
			agent: false
		}, options || {});

		debugRequest(reqNum, request, body);

		return processRequest(request, body).then((results) => {
			if(results.Error){
				const err = new Error(results.Error.Description);

				err.code = results.Error.ErrorCode;

				throw err;
			}

			debugResponse(reqNum, results);

			return results;
		});
	}

	/* Forms API */
	getForms(querystring) {
		return this.request('forms.xml', {
			method: 'GET'
		}, merge({
			username: this.settings.username,
			password: this.settings.password
		}, querystring || {}));
	}

	/* Submissions API */
	getSubmissions(querystring) {
		return this.request('submissions.xml', {
			method: 'GET'
		}, merge({
			username: this.settings.username,
			password: this.settings.password
		}, querystring || {}));
	}

	/* Images API */
	getImages(querystring) {
		return this.request('images.xml', {
			method: 'GET'
		}, merge({
			username: this.settings.username,
			password: this.settings.password
		}, querystring || {}));
	}

	/* Reference Data API */
	postReferenceData(data, querystring) {
		if(!data){
			data = {};
		}

		let rootAttrs = {},
			body = '';

		if(data.Name){
			rootAttrs.Name = data.Name;
		}

		if(data.UserGroup){
			rootAttrs.UserGroup = data.UserGroup;
		}

		if(data.UserGroupColumn){
			rootAttrs.UserGroupColumn = data.UserGroupColumn;
		}

		if(data.Department){
			rootAttrs.Department = data.Department;
		}

		if(data.Action){
			rootAttrs.Action = data.Action;
		}

		const builder = new xml.Builder({
			rootName: 'List',
			xmldec: {
				encoding: this.settings.options.encoding
			},
			renderOpts: {
				pretty: false
			}
		});

		try {
			body = builder.buildObject({
				$: rootAttrs,
				Columns: {
					c: data.columns || []
				},
				Rows: {
					r: (data.rows || []).map((row) => {
						return row.map((value) => {
							return {
								v: value
							};
						});
					})
				}
			});
		}catch(err){
			return Promise.reject(err);
		}

		return this.request('reference_datas', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/xml'
			}
		}, merge({
			username: this.settings.username,
			password: this.settings.password
		}, querystring || {}), body);
	}

	/* CSV Meta Data API */
	postCSVMetaData(data, querystring) {
		return this.request('csv', {
			method: 'POST'
		}, merge({
			username: this.settings.username,
			password: this.settings.password
		}, querystring || {}), data);
	}

	/* CSV API */
	getCSV(querystring) {
		return this.request('csv.xml', {
			method: 'GET'
		}, merge({
			username: this.settings.username,
			password: this.settings.password
		}, querystring || {}));
	}

	/* Dispatch Items API */
	postDispatchItems(data, querystring) {
		return Promise.reject(new Error('Not Implemented'));
	}

	/* Department API */
	getDepartments(querystring) {
		return Promise.reject(new Error('Not Implemented'));
	}

}

/* Helpers */
const processRequest = function(options, body){
	return new Promise((resolve, reject) => {
		const req = (options.port === 443 ? https : http).request(options, (response) => {
			const buffers = [];

			response.on('data', (chunk) => {
				buffers.push(chunk);
			});

			response.on('end', () => {
				const buffer = Buffer.concat(buffers);

				if(response.headers['content-type'].match(/application\/xml/) && !options.path.match('images.xml')){
					xml.parseString(buffer.toString('utf8'), {
						async: true
					}, (err, result) => {
						if(err){
							return reject(err);
						}

						try {
							result = cleanXML(result.CanvasResult);
						}catch(err){
							return reject(err);
						}

						resolve(result);
					});
				} else {
					resolve(buffer);
				}
			});
		});

		if(body){
			if(typeof(body) === 'object'){
				try {
					body = JSON.stringify(body);
				}catch(err){
					return reject(err);
				}
			}

			req.write(body);
		}

		req.on('error', (err) => {
			reject(err);
		});

		req.end();
	});
};

/* Expose Properties */
GoCanvas.defaults = {
	service: {
		hostname: 'www.gocanvas.com',
		port: 443,
		path: '/apiv2'
	},

	options: {
		encoding: 'utf-8'
	},

	username: '',
	password: ''
};

/* Export Module */
if(typeof(module) !== 'undefined' && module.exports){
	module.exports = GoCanvas;
}else
if(typeof(define) === 'function' && define.amd){
	define('GoCanvas', [], function(){
		return GoCanvas;
	});
}
