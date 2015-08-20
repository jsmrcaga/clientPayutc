// *****************************************************************************
// The MIT License (MIT)

// Copyright (c) 2015-2016 
// Jo Colina - @jsmrcaga

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// *****************************************************************************


var payutc = (function(){
	/** @lends payutc.prototype*/
	function timeInSQL () {

		var today = new Date();
		var dd = today.getDate();
		var mm = today.getMonth()+1; //January is 0!
		var yyyy = today.getFullYear();

		var min = today.getMinutes();
		var hrs = today.getHours();
		var sec = today.getSeconds();

		if(dd<10) {
		    dd='0'+dd
		} 

		if(mm<10) {
		    mm='0'+mm
		} 

		if (hrs<10){
			hrs = '0' + hrs;
		}


		if (min<10){
			min = '0' + min;
		}


		if (sec<10){
			sec = '0' + sec;
		}
		today = yyyy+'-'+mm+'-'+dd+' '+hrs+':'+min+':'+sec;
		
		// console.log(today);
		return today;
	}


	var payutcAPI = {
		config: {
			url : "https://api.nemopay.net/services/",
			username : "yourID",
			password : "yourPSWD",
			systemID : "payutc",
			async: false,
			app_key: "yourapplicationkey", 
			fun_id: 34752342,
			sessionID : 0,
			logged_usr : "",
			loginMethod : "payuser"
		},

		checkSession : false,



		loginPayutcUser: function(login, pass) {
			var params = {login: login, password: pass};
			var xml = new XMLHttpRequest();
			xml.open("POST", this.config.url + "GESARTICLE/login2?system_id=" + this.config.systemID, false);
			xml.setRequestHeader("Content-type", "application/json");
			xml.send(JSON.stringify(params));
			var resp = JSON.parse(xml.responseText);
			if (typeof resp.sessionid != "undefined"){
				this.config.sessionID = JSON.parse(xml.responseText).sessionid;
				this.logged_usr = JSON.parse(xml.responseText).username;
				console.info("Logged user successfully: ", this.config.logged_usr);
				return resp;
			}else{
				throw new Error("Error logging in: " + resp.error.message);
			}
		},

		loginCASUser: function(service, ticket){

		},

		verifySession: function(service, ticket) {
			if (this.config.sessionID == 0){
				console.warn("User not logged, logging...");
				if (this.config.loginMethod == 'CAS'){
					return this.loginCASUser()
				}else if(this.config.loginMethod == 'payuser'){
					return this.loginPayutcUser(this.config.username, this.config.password);
				}
			}
			console.info("User already logged, session_id is: ", this.config.sessionID);
		},


		genericApiCall: function(service, method, data, callback) {
			if (this.config.app_key == 0 && this.config.systemID == "sys_id"){
				throw new Error("Configuration not set! Use payutc.config.init()");
			}

			var url = this.config.url + service + "/" + method + "?system_id=" + this.config.systemID  + "&app_key=" + this.config.app_key;
			if (this.config.sessionID){
				url += "&sessionid=" + this.config.sessionID;
			}
			var xml = new XMLHttpRequest();
			
			xml.onreadystatechange = function(){
				if (xml.readyState == 4 && xml.status == 200){
					if (typeof callback != 'undefined') callback(xml.responseText);
					return xml.responseText;
				}
			};
			
			if (typeof data != "undefined"){
				xml.open("POST", url, this.config.async);
				xml.setRequestHeader("Content-type", "application/json");
				xml.send(JSON.stringify(data)); //session_id: this.sessionID
			}else{
				xml.open("POST", url, this.config.async);
				xml.send();
			}
			// console.log("URL Sent: ", url);
			// console.log("Data sent: ", String(data));
			// console.log("ResponseText: ", xml.responseText);	
			return xml.responseText;
		}
	};

	/**
	 * This is the payutc class.</br>
	 * Construct payutc object.
	 * It is a singleton defined as an object literal, 
	 * although it can be copied.
	 * @namespace payutc 
	*/
	var payutc = {

		/**
		 * This function allows the user to change the configuration
		 * object to their liking. <code>payutc.login(params)</code>
		 * allows for a simple and fast configuration.
		 * @function
		 * @memberof payutc
		 * @param {Object} params - An object containing the properties 
		 * needed for the <code>config</code> object. 
		 * @param {string} params.endpoint - The URL where the API is located
		 * @param {string} params.u_name - The username to use with <code>payuser_default</code>
		 * @param {string} params.p_word - The password to use with <code>payuser_default</code>
		 * @param {string} params.sys_id - The system ID, normally <code>payutc</code>
		 * @param {integer} params.fun_id - The fundation ID to use with all requests. If
		 * in need to change see <code>config.setFundation</code>
		*/
		init: function(params){
			/*params = {
				endpoint,
				u_name,
				p_word,
				sys_id,
				fun_id
			}*/
			if (typeof params == "undefined" ||
				// typeof params.endpoint == "undefined" ||
				// typeof params.u_name == "undefined" ||
				// typeof params.p_word == "undefined" ||
				// typeof params.sys_id == "undefined" ||
				// typeof params.fun_id == "undefined" ||
				typeof params.app_key == "undefined"
				){
				throw new Error("params{}, .endpoint, .u_name, .p_word, .sys_id and .fun_id are required");
			}

			payutcAPI.config.url = params.endpoint || null;
			payutcAPI.config.username = params.u_name || null;
			payutcAPI.config.password = params.p_word || null;
			payutcAPI.config.systemID = params.sys_id || null;
			payutcAPI.config.fun_id = params.fun_id || null;
			payutcAPI.config.app_key = params.app_key;
		},

		/**
		* The config object containing all config related methods.
		* @namespace payutc.config
		* @memberof payutc
		*/
		config:{
			/**
			* Used to set the endpoint in the configuration object.
			* @param {string} url - the Endpoint to be used in all requests.
			*/ 
			setEndpoint: function (url) {
				if(typeof url == "undefined") throw new Error("url is required for payutc.config.setEndpoint");
				payutcAPI.config.url = url;
			},

			/**
			* Used to set the IDs in the configuration obejct.
			* @param {string} username - your payuser username
			* @param {string} password - your payuser password
			*/
			setUID: function (username, password){
				if (typeof username == "undefined" || typeof password == "undefined"){
					throw new Error("(username,password) are required for payutc.config.setUID");
				}
				payutcAPI.config.username = username;
				payutcAPI.config.password = password;
			},

			/**
			* Used to set the system ID, normally <code>payutc</code>
			* @param {string} sysId - the system ID
			*/
			setSysId: function(sysId){
				if (typeof sysId == "undefined"){
					throw new Error("sysId is required for payutc.config.setSysId");
				}
				payutcAPI.config.systemID = sysId;
			},

			/**
			* Used to set if the whole <code>payutc</code> API calls will be sync or async.</br>
			* For the moment useless, as async is not yet supported
			* @param {bool} async - async or not (duh?)
			*/
			isAsync: function (async){
				if(typeof async == "undefined"){
					throw new Error("async is required for payutc.config.isAsync");
				}
				payutcAPI.config.async = async;
			},


			/**
			* Used to set the fundation ID in the configuration object
			* @param {integer} funId - The fundation ID for all requests
			*/
			setFundation: function(funId){
				if(typeof funI == "undefined"){
					throw new Error("funId is required for payutc.config.setFundation");
				}
				payutcAPI.config.fun_id = funId;
			},

			/**
			* Used to set the application key in the configuration object
			* @param {integer} appKey - the application key for all requests
			*/
			setAppKey : function(appKey){
				if (typeof appKey == "undefined"){
					throw new Error("AppKey is required");
				}
				payutcAPI.config.app_key = appKey;
			}

		},

		/**
		* The <code>login</code> object, containing the login related methods
		* @constructor
		*/
		login: {
			cas: function(service, ticket){
				return payutcAPI.genericApiCall("GESARTICLE", "loginCas", {service: service, ticket:ticket});
			},

			payuser: function(login, password){

				var resp = JSON.parse(payutcAPI.genericApiCall("GESARTICLE", "login2", {login: login, password: password}));
				if (typeof resp.sessionid != "undefined"){
					payutcAPI.config.sessionID = resp.sessionid;
					payutcAPI.config.logged_usr = resp.username;
					console.log("Logged user successfully:", payutcAPI.config.logged_usr);
					return 1;
				}

				return -1;

			},

			payuser_default: function(){
				var resp = JSON.parse(payutcAPI.genericApiCall("GESARTICLE", "login2", {login: payutcAPI.config.username, password: payutcAPI.config.password}));
				if (typeof resp.sessionid != "undefined"){
					payutcAPI.config.sessionID = resp.sessionid;
					payutcAPI.config.logged_usr = resp.username;
					console.log("Logged user successfully:", payutcAPI.config.logged_usr);
				}
			}
		},

		stats: {
			getNbSell : function(objId, funId, start, end, tick){

				return payutcAPI.genericApiCall("STATS", "getNbSell", {obj_id: objId, fun_id: funId, start: start, end: end || timeInSQL()});
			},

			getRevenue: function(funId, start, end, appId){
				//exception pour appID
				//appId , start, end, tick are optional
				if (typeof appId != "undefined"){
					return payutcAPI.genericApiCall("STATS", "getRevenue", {fun_id: funId, app_id: appId, start: start || "1999-01-01T00:00", end: end || "2060-01-01T00:00"});
				}else{
					return payutcAPI.genericApiCall("STATS", "getRevenue", {fun_id: funId, start: start || "1999-01-01T00:00", end: end || "2060-01-01T00:00"});
				}
			},

			getOperatorsStats: function(funId, start, end){
				if (typeof start == "undefined"){
					return payutcAPI.genericApiCall("STATS", "getOperatorsStats", {fun_id: funId});
				}else{
					return payutcAPI.genericApiCall("STATS", "getOperatorsStats", {fun_id: funId, start:start, end: end});
				}
			}

		

			
		},

		users: {
			transfer: function(amount, usr_id, message){
				// needs CAS auth to retrieve user account
				// use loginCAS before using transfer, useless in client mode?
				return payutcAPI.genericApiCall("TRANSFER", "transfer", {amount: amount, userID: usr_id, message: message});
			},
		},


		/*******************
		// GESTION ARTICLES
		*******************/
		articles: {

			getArticles: function(funId){
				return payutcAPI.genericApiCall("POSS3", "getArticles", {fun_id:funId});
			},

			getProducts: function(funIdsArray){
				return payutcAPI.genericApiCall("GESARTICLE", "getProducts", {fun_ids:funIdsArray});			
			}, 

			getCategories: function(funIdsArray){
				return payutcAPI.genericApiCall("GESARTICLE", "getCategories", {fun_ids: funIdsArray});
			},

			getCategory: function(catId, funId){
				return payutcAPI.genericApiCall("GESARTICLE", "getCategory", {fun_id: funId, obj_id: catId});
			},

			setCategory: function(name, funId, objId, parentId){
				//objId and parentId are optional
				return payutcAPI.genericApiCall("GESARTICLE", "setCategory", {name: name, parent_id: parentId || "null", fun_id: funId, obj_id: objId || "null"});
			},

			deleteCategory: function(catId, funId){
				//on est obliges d'eliminer les articles en cascade
				//pour cela on recup tous les articles de la fun 
				//vu que getProductsByCategory nexiste plus
				//et on compare le category_id de l'article avec catId
				//a eliminer, si ce sont les memes, le produit est elimine
				if (payutcAPI.config.async != false){
					var change =payutcAPI.config.async;
					payutcAPI.config.async = false;
				}
				// /we make async false so that every product is deleted one by one before the category
				var prod = this.getProducts([payutcAPI.config.fun_id]);
				prod = JSON.parse(prod);
				for (var i =0 ; i< prod.length; i++){
					if (Number(prod[i].categorie_id) == catId){
						this.deleteProduct(prod[i].id, payutcAPI.config.fun_id);
					}
				}

				if (change){
					payutcAPI.config.async = change; //in theory = true
				}

				return payutcAPI.genericApiCall("GESARTICLE", "deleteCategory", {obj_id: catId, fun_id: funId});
			},

			getProduct : function(objId, funId){
				return payutcAPI.genericApiCall("GESARTICLE", "getProduct", {obj_id: objId, fun_id: funId || "null"});
			},

			getProductsByCategory: function(funIdsArray){
				// funIds as array
				var prods = [], cats = [];
				prod = JSON.parse(this.getArticles(funIdsArray[0]));
				var categ = JSON.parse(this.getCategories(funIdsArray));

				var resp = [];

				

				for (var i = 0; i < categ.length; i++){
					resp[i] = {
						name: categ[i].name,
						id: categ[i].id,
						products: [],
					};
				}

				for (var i =0 ; i< prod.length; i++){
					for (var j=0; j<resp.length; j++){
						if (prod[i].categorie_id == resp[j].id){
							resp[j].products.push(prod[i]);
						}
					}
				}

				return JSON.stringify(resp);
				//we stringify because of integrity of code

			},

			setProduct: function(name, category, price, stock, alcool, image, funId, objId, tva, cotisant){
				//objId, tva and cotisant are optional
				//objId is only if remaking an article
				//prix en euros
				if (alcool == true) alcool = 0;
				if (alcool == false) alcool =1;
				return payutcAPI.genericApiCall("GESARTICLE", "setProduct", {name: name, parent: category, prix: price, stock: stock, alcool: alcool, 
					image: image, fun_id: funId, obj_id: objId || null, tva: tva || "0.00", cotisant: cotisant || "1"});
			},

			deleteProduct: function(objId, funId){
				return payutcAPI.genericApiCall("GESARTICLE", "deleteProduct",{obj_id: objId, fun_id: funId});
			}, 

		
		},

		treso: { //a revoir

			getDetails: function(funId, start, end){
				return payutcAPI.genericApiCall("TRESO", "getDetails", {fun_id:funId, start: start || null, end: end || null});
			},

			//getvendeur 
		},

		reload: {
			info:function(){
				return payutcAPI.genericApiCall("RELOAD", "info");
			}
		},

	};

	return payutc;
})();