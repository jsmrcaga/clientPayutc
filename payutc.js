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

/**
* @file The official documentation for <code>payutc.js</code>. This documentation serves both the 
* <strong>client</strong> and <strong>server</strong> libraries. </br>
* It is worth noting that all functions in <strong>server</server> require a <code>params</code> object as
* argument. This <code>params</code> object will contain every argument that the client library needed.</br>
* <i>Example:</i> If using <code>payutc.login.payuser(username, password)</code>, you will need to pass: 
* <strong><code>payutc.login.payuser({username: "usrnm", password: "pswrd", callback: callbackFunction})</code></strong>
* @author Jo Colina @jsmrcaga
*/
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
	 * @global
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
			* @function setEndpoint
			* @param {string} url - the Endpoint to be used in all requests.
			* @memberof payutc.config
			*/ 
			setEndpoint: function (url) {
				if(typeof url == "undefined") throw new Error("url is required for payutc.config.setEndpoint");
				payutcAPI.config.url = url;
			},

			/**
			* Used to set the IDs in the configuration obejct.
			* @function setUID
			* @param {string} username - your payuser username
			* @param {string} password - your payuser password
			* @memberof payutc.config
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
			* @function setSysId
			* @param {string} sysId - the system ID
			* @memberof payutc.config
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
			* @function isAsync
			* @param {bool} async - async or not (duh?)
			* @memberof payutc.config
			*/
			isAsync: function (async){
				if(typeof async == "undefined"){
					throw new Error("async is required for payutc.config.isAsync");
				}
				payutcAPI.config.async = async;
			},


			/**
			* Used to set the fundation ID in the configuration object
			* @function setFundation
			* @param {integer} funId - The fundation ID for all requests
			* @memberof payutc.config
			*/
			setFundation: function(funId){
				if(typeof funI == "undefined"){
					throw new Error("funId is required for payutc.config.setFundation");
				}
				payutcAPI.config.fun_id = funId;
			},

			/**
			* Used to set the application key in the configuration object
			* @function setAppKey
			* @param {integer} appKey - the application key for all requests
			* @memberof payutc.config
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
		* @namespace payutc.login
		* @memberof payutc
		*/
		login: {
			/**
			* Used to login users via CAS (Central Auth. Service)
			* @function cas
			* @param {string} service - The service to be redirected to after cas login. Typically a link, 
			* the same that would be given to CAS.
			* @param {string} ticket - The ticket received after a CAS demand at <code>casurl/cas/login</code>
			* @memberof payutc.login 
			*/
			cas: function(service, ticket){
				return payutcAPI.genericApiCall("GESARTICLE", "loginCas", {service: service, ticket:ticket});
			},

			/**
			* Used to login a registered user of payutc service. To register contact NemoPay.
			* @function payuser
			* @param {string} login - The username registered at payutc service
			* @param {string} password - The password used when registering
			* @memberof payutc.login
			*/
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

			/**
			* Used to sign-in a user using payuser IDs from config object.
			* @function payuser_default
			* @memberof payutc.login
			*/
			payuser_default: function(){
				var resp = JSON.parse(payutcAPI.genericApiCall("GESARTICLE", "login2", {login: payutcAPI.config.username, password: payutcAPI.config.password}));
				if (typeof resp.sessionid != "undefined"){
					payutcAPI.config.sessionID = resp.sessionid;
					payutcAPI.config.logged_usr = resp.username;
					console.log("Logged user successfully:", payutcAPI.config.logged_usr);
				}
			}
		},

		/**
		* The <code>stats</code> object, containing all the statistics related methods
		* @namespace payutc.stats
		* @memberof payutc
		*/
		stats: {
			/**
			* Gets the number of sold items in a given period
			* @function getNbSell
			* @param {integer} objId - The object ID of which you want the sold number
			* @param {integer} funId - The fundation ID to which the object belongs
			* @param {Date} start - The date of the beginning requested period
			* @param {Date} end - The date of the end of the period
			* @memberof payutc.stats
			*/
			getNbSell : function(objId, funId, start, end, tick){

				return payutcAPI.genericApiCall("STATS", "getNbSell", {obj_id: objId, fun_id: funId, start: start, end: end || timeInSQL()});
			},

			/**
			* Gets the revenue made in a certain period, can be used to retreived revenue made by a single application
			* @fundtion getRevenue
			* @param {integer} funId - The fundation ID of which we want the revenue, or to which the application belongs
			* @param {Date} start - The date of the beginning of the requested period
			* @param {Date} end - The date of the end of the requested period
			* @param {integer} appId - The ID of the application of which we require the revenue
			* @memberof payutc.stats
			*/
			getRevenue: function(funId, start, end, appId){
				//exception pour appID
				//appId , start, end, tick are optional
				if (typeof appId != "undefined"){
					return payutcAPI.genericApiCall("STATS", "getRevenue", {fun_id: funId, app_id: appId, start: start || "1999-01-01T00:00", end: end || "2060-01-01T00:00"});
				}else{
					return payutcAPI.genericApiCall("STATS", "getRevenue", {fun_id: funId, start: start || "1999-01-01T00:00", end: end || "2060-01-01T00:00"});
				}
			},

			/**
			* Used to get the stats of the operators
			* @function getOperatorsStats
			* @param {integer} funId - The fundation Id of the operators
			* @param start {Date} start - The start date of the requested period
			* @param end {Date} end - The end date of the requested period
			* @memberof payutc.stats
			*/
			getOperatorsStats: function(funId, start, end){
				if (typeof start == "undefined"){
					return payutcAPI.genericApiCall("STATS", "getOperatorsStats", {fun_id: funId});
				}else{
					return payutcAPI.genericApiCall("STATS", "getOperatorsStats", {fun_id: funId, start:start, end: end});
				}
			}

		

			
		},

		/**
		* The <code>users</code> object, containing all the users related methods</br>
		* Not very useful for the time being
		* @namespace payutc.users
		* @memberof payutc
		*/
		users: {
			/**
			* Used to make transfers between two users. </br> User making the transfer must be logged via CAS.
			* @see {@link payutc.login.cas}
			* @function transfer
			* @param {integer} amount - the amount to be transfered
			* @param {integer} usr_id - The ID of the user to whom the money will be transfered
			* @param {string} message - The message to be sent along with the transfer
			* @memberof payutc.users
			*/
			transfer: function(amount, usr_id, message){
				// needs CAS auth to retrieve user account
				// use loginCAS before using transfer, useless in client mode?
				return payutcAPI.genericApiCall("TRANSFER", "transfer", {amount: amount, userID: usr_id, message: message});
			},
		},


		/*******************
		// GESTION ARTICLES
		*******************/

		/**
		* The <code>articles</code> object, containing all the articles related methods</br>
		* @namespace payutc.articles
		* @memberof payutc
		*/
		articles: {

			/**
			* Used to get a list of all articles in a given fundation
			* @function getArticles
			* @param {integer} funId - The fundation ID of which to retreive the articles
			* @memberof payutc.articles
			*/
			getArticles: function(funId){
				return payutcAPI.genericApiCall("POSS3", "getArticles", {fun_id:funId});
			},

			/**
			* Used to get a list of all products in a given fundation. </br>
			* Different from getArticles because it retreives them even if disabled
			* @function getProducts
			* @param {integer[]} funIdsArray - The fundation IDs of which to retreive the articles, in an array
			* @memberof payutc.articles
			*/
			getProducts: function(funIdsArray){
				return payutcAPI.genericApiCall("GESARTICLE", "getProducts", {fun_ids:funIdsArray});			
			}, 

			/**
			* Used to get a list of all categories in a given fundation
			* @function getCategories
			* @param {integer[]} funIdsArray - The fundation ID of which to retreive the categories
			* @memberof payutc.articles
			*/
			getCategories: function(funIdsArray){
				return payutcAPI.genericApiCall("GESARTICLE", "getCategories", {fun_ids: funIdsArray});
			},

			/**
			* Used to get a list of all articles in a given category of a given fundation
			* @function getCategory
			* @param {integer} catId - The category ID of which to retreive the articles
			* @param {integer} funId - The fundation ID of which to retreive the category
			* @memberof payutc.articles
			*/
			getCategory: function(catId, funId){
				return payutcAPI.genericApiCall("GESARTICLE", "getCategory", {fun_id: funId, obj_id: catId});
			},

			/**
			* Used to set a given category, creating it or changing its name. </br>
			* If objId is specified a category will be changed, if not, will be created.
			* @function setCategory
			* @param {string} name - The name of the category
			* @param {integer} funId - The fundation ID in which to make/change the category
			* @param {integer} [objId=null]  - The ID of the category if wanted to change one.
			* @param {integer} [parentId=null] - The id of the category in which the new one will be nested  
			* @memberof payutc.articles
			*/
			setCategory: function(name, funId, objId, parentId){
				//objId and parentId are optional
				return payutcAPI.genericApiCall("GESARTICLE", "setCategory", {name: name, parent_id: parentId || "null", fun_id: funId, obj_id: objId || "null"});
			},

			/**
			* Used to delete a category in a given fundation
			* @function deleteCategory
			* @param {integer} catId - The ID of the category to delete
			* @param {integer} funId - The fundation ID in which the category is nested
			* @memberof payutc.articles
			*/
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

			/**
			* Used to get the details of a certain product in a given fundation
			* @function getProduct
			* @param {integer} objId - The ID of the Product of which we want the details 
			* @param {integer} funId - The fundation ID of which to retreive the product
			* @memberof payutc.articles
			*/
			getProduct : function(objId, funId){
				return payutcAPI.genericApiCall("GESARTICLE", "getProduct", {obj_id: objId, fun_id: funId || "null"});
			},

			/**
			* Used to get a list of all articles in their respective categories.</br>
			* This function, not implemented in the API, is made by <code>payutc.js</code>,
			* meaning that it will use getArticles and getCategories.
			* @function getProductsByCateogry
			* @param {integer[]} funIdsArray - The fundation ID of which to retreive the articles. Only one element must be present in the array,
			* @memberof payutc.articles
			*/
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

			/**
			* Used to set or change a product ina given fundation
			* @function setProduct
			* @param {string} name - The name of the product
			* @param {integer} category - The ID of the category to which the product belongs
			* @param {integer} price - The price of the object, in cents.
			* @param {integer} stock - The quantity of the product
			* @param {bool} alcool - If the product contains alcohol
			* @param {image64} image - Not sure, but can be set to 0.
			* @param {integer} objId - The ID of the object. If set to <code>null</code> a new object will be created.
			* @param {bool} cotisant - Automatically set to true, accepts <code>0|1|true|false</code>
			* @param {integer} funId - The fundation ID of which to retreive the articles
			* @memberof payutc.articles
			*/
			setProduct: function(name, category, price, stock, alcool, image, funId, objId, tva, cotisant){
				//objId, tva and cotisant are optional
				//objId is only if remaking an article
				//prix en euros
				if (alcool == true) alcool = 0;
				if (alcool == false) alcool =1;
				return payutcAPI.genericApiCall("GESARTICLE", "setProduct", {name: name, parent: category, prix: price, stock: stock, alcool: alcool, 
					image: image, fun_id: funId, obj_id: objId || null, tva: tva || "0.00", cotisant: cotisant || "1"});
			},

			/**
			* Used to delete a product in a given fundation
			* @function deleteProduct
			* @param {integer} objId - The ID of the product to be deleted
			* @param {integer} funId - The fundation ID to which the product belongs
			* @memberof payutc.articles
			*/
			deleteProduct: function(objId, funId){
				return payutcAPI.genericApiCall("GESARTICLE", "deleteProduct",{obj_id: objId, fun_id: funId});
			}, 

		
		},


		/**
		* The <code>treso</code> object, containing all the treasury related methods</br>
		* @namespace payutc.treso
		* @memberof payutc
		*/
		treso: { //a revoir

			/**
			* Used to get the details of the transactions of a certain fundation
			* @function getDetails
			* @param {integer} funId - The fundation ID to which the product belongs
			* @param {Date} start - The start date for the requested period
			* @param {Date} end - The end date of the requested period
			* @memberof payutc.treso
			*/
			getDetails: function(funId, start, end){
				return payutcAPI.genericApiCall("TRESO", "getDetails", {fun_id:funId, start: start || null, end: end || null});
			},

			//getvendeur 
		},

		/**
		* The <code>realod</code> object, containing all the reloading related methods</br>
		* @namespace payutc.reload
		* @memberof payutc
		*/
		reload: {
			/**
			* Not sure of its utility
			* @function info
			* @memberof payutc.reload
			*/
			info:function(){
				return payutcAPI.genericApiCall("RELOAD", "info");
			}
		},

	};

	return payutc;
})();