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
var http = require('https');

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

// date.toISOString


var payutcAPI = {
	config: {
		url : "api.nemopay.net",
		username : "colinajo",
		password : "Tennis15",
		systemID : "payutc",
		async: false,
		app_key: "44682eb98b373105b99511d3ddd0034f", 
		fun_id: 2,
		sessionID : 0,
		logged_usr : "",
		loginMethod : "payuser"
	},

	checkSession : false,


	/*
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
	*/

	genericApiCall: function(service, method, data, callback) {

		var response = "";
		var url = "/services/" + service + "/" + method + "?system_id=" + this.config.systemID  + "&app_key=" + this.config.app_key;
		if (this.config.sessionID){
			url += "&sessionid=" + this.config.sessionID;
		}

		var options = {
			hostname: this.config.url,
			path: url,
			method: 'POST',
			headers: {
				'Content-type': "application/json"
			}
		};
		
		var request = http.request(options, function(res){
			res.setEncoding('utf8');
			res.on('data', function(chunk){
				// console.log('Body: ' + chunk);
				response += chunk;
			});

			res.on('end', function(){
				callback(response);
			});
		});



		request.on('error', function(e){
			// throw new Error("Error whith request: " + e.message);
			console.warn("Error with request: ", e);
		});

		if (typeof data != "undefined"){
			options.headers = {
				'Content-type' : "application/json"
			};

			request.write(JSON.stringify(data)); //session_id: this.sessionID
			request.end();
		}else{
			request.end()
		}
		// console.log("URL Sent: ", url);
		// console.log("Data sent: ", String(data));
		// console.log("ResponseText: ", xml.responseText);	
	}
};



//This is the object that will contain all services
//and all methods in payutc's api.
//ex: payutc.stats.getNbSell(obj_id);
module.exports = {


		init: function(params){
			/*params = {
				endpoint,
				u_name,
				p_word,
				sys_id,
				fun_id
			}*/
			if (typeof params == "undefined" ||
				typeof params.endpoint == "undefined" ||
				typeof params.u_name == "undefined" ||
				typeof params.p_word == "undefined" ||
				typeof params.sys_id == "undefined" ||
				typeof params.fun_id == "undefined" ||
				typeof params.app_key == "undefined"
				){
				// throw new Error("params{}, .endpoint, .u_name, .p_word, .sys_id and .fun_id are required");
			}

			payutcAPI.config.url = params.endpoint;
			payutcAPI.config.username = params.u_name;
			payutcAPI.config.password = params.p_word;
			payutcAPI.config.systemID = params.sys_id;
			payutcAPI.config.fun_id = params.fun_id;
			payutcAPI.config.app_key = params.app_key;
		},

		config:{
			//use to make setter functions
			//to modify payutcAPI config 
			setUrl: function (url) {
				if(typeof url == "undefined") throw new Error("url is required for payutc.config.setUrl");
				payutcAPI.config.url = url;
			},

			setUID: function (username, password){
				if (typeof username == "undefined" || typeof password == "undefined"){
					throw new Error("(username,password) are required for payutc.config.setUID");
				}
				payutcAPI.config.username = username;
				payutcAPI.config.password = password;
			},

			setSysId: function(sysId){
				if (typeof sysId == "undefined"){
					throw new Error("sysId is required for payutc.config.setSysId");
				}
				payutcAPI.config.systemID = sysId;
			},

			isAsync: function (async){
				if(typeof async == "undefined"){
					throw new Error("async is required for payutc.config.isAsync");
				}
				payutcAPI.config.async = async;
			},


			setFundation: function(funId){
				if(typeof funI == "undefined"){
					throw new Error("funId is required for payutc.config.setFundation");
				}
				payutcAPI.config.fun_id = funId;
			}

		},

		login: {
			cas: function(params){
				// var params = {service, ticket}
				return payutcAPI.genericApiCall("GESARTICLE", "loginCas", {service: params.service, ticket: params.ticket}, params.callback);
			},

			payuser: function(params){
				// var params = {login, password}
				payutcAPI.genericApiCall("GESARTICLE", "login2", {login: params.login, password: params.password}, function(data){

					var resp = JSON.parse(data);

					if (typeof resp.sessionid != "undefined"){
						payutcAPI.config.sessionID = resp.sessionid;
						payutcAPI.config.logged_usr = resp.username;
						console.log("Logged user successfully:", payutcAPI.config.logged_usr);
					}
					
					params.callback(JSON.stringify(data));
				});

			},

			payuser_default: function(){
				var resp = JSON.parse(payutcAPI.genericApiCall("GESARTICLE", "login2", {login: payutcAPI.config.username, password: payutcAPI.config.password},params.callback));
				if (typeof resp.sessionid != "undefined"){
					payutcAPI.config.sessionID = resp.sessionid;
					payutcAPI.config.logged_usr = resp.username;
					console.log("Logged user successfully:", payutcAPI.config.logged_usr);
				}
			}
		},

		stats: {
			getNbSell : function(params){
				// var params = {objId, funId, start, end, tick};
				return payutcAPI.genericApiCall("STATS", "getNbSell", {obj_id: params.objId, fun_id: params.funId, start: params.start, end: params.end || timeInSQL()},params.callback);
			},

			getRevenue: function(params){
				// var params = {funId, start, end, appId};

				//exception pour appID
				//appId , start, end, tick are optional
				if (typeof appId != "undefined"){
					return payutcAPI.genericApiCall("STATS", "getRevenue", {fun_id: params.funId, app_id: params.appId, start: params.start || "1999-01-01T00:00", end: params.end || "2060-01-01T00:00"}, params.callback);
				}else{
					return payutcAPI.genericApiCall("STATS", "getRevenue", {fun_id: params.funId, start: params.start || "1999-01-01T00:00", end: params.end || "2060-01-01T00:00"}, params.callback);
				}
			},


			
		},

		users: {
			transfer: function(params){
				// var params = {amount, usr_id, message};

				// needs CAS auth to retrieve user account
				// use loginCAS before using transfer, useless in client mode?
				return payutcAPI.genericApiCall("TRANSFER", "transfer", {amount: params.amount, userID: params.usr_id, message: params.message},params.callback);
			},
		},


		/*******************
		// GESTION ARTICLES
		*******************/
		articles: {
			getArticles: function(params){
				//var params = {funId}
				return payutcAPI.genericApiCall("POSS3", "getArticles", {fun_id:params.funId}, params.callback);
			},

			getProducts: function(params){
				// var params = {funIdsArray};

				return payutcAPI.genericApiCall("GESARTICLE", "getProducts", {fun_ids:params.funIdsArray},params.callback);			
			}, 

			getCategories: function(params){
				// var params = {funIdsArray};

				return payutcAPI.genericApiCall("GESARTICLE", "getCategories", {fun_ids: params.funIdsArray},params.callback);
			},

			getCategory: function(params){
				// var params = {catId, funId};

				return payutcAPI.genericApiCall("GESARTICLE", "getCategory", {fun_id: params.funId, obj_id: params.catId},params.callback);
			},

			setCategory: function(params){
				// var params = {name, funId, objId, parentId};

				//objId and parentId are optional
				return payutcAPI.genericApiCall("GESARTICLE", "setCategory", {name: params.name, parent_id: params.parentId || "null", fun_id: params.funId, obj_id: params.objId || "null"},params.callback);
			},

			deleteCategory: function(params){
				// var params = {catId, funId};

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

				return payutcAPI.genericApiCall("GESARTICLE", "deleteCategory", {obj_id: params.catId, fun_id: params.funId},params.callback);
			},

			getProduct : function(params){
				// var params = {objId, funId};

				return payutcAPI.genericApiCall("GESARTICLE", "getProduct", {obj_id: params.objId, fun_id: params.funId || "null"},params.callback);
			},

			getProductsByCategory: function(params){
				// var params = {funIdsArray};

				// funIds as array
				var prods = [], cats = [];
				var parent = this;

				this.getArticles({funId: params.funIdsArray[0], callback: function(dataProds){
					var prod = JSON.parse(dataProds);

					parent.getCategories({funIdsArray: params.funIdsArray, callback: function(dataCateg){

						var categ = JSON.parse(dataCateg);

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

						params.callback(resp);
						return resp;
					}});

					
				}});


			},

			setProduct: function(params){
				// var params = {name, category, price, stock, alcool, image, funId, objId, tva, cotisant};

				//objId, tva and cotisant are optional
				//objId is only if remaking an article
				//prix en euros
				if (params.alcool == true) params.alcool = 0;
				if (params.alcool == false) params.alcool =1;
				return payutcAPI.genericApiCall("GESARTICLE", "setProduct", {name: params.name, parent: params.category, prix: params.price, stock: params.stock, alcool: params.alcool, 
					image: params.image, fun_id: params.funId, obj_id: params.objId || null, tva: params.tva || "0.00", cotisant: params.cotisant || "1"},params.callback);
			},

			deleteProduct: function(params){
				// var params = {objId, funId};

				return payutcAPI.genericApiCall("GESARTICLE", "deleteProduct",{obj_id: params.objId, fun_id: params.funId},params.callback);
			}, 

		
		},

		reload: {
			info:function(){
				return payutcAPI.genericApiCall("RELOAD", "info");
			},

			reload: function(params){
				// var params = amount, callbackUrl
				return payutcAPI.genericApiCall("RELOAD", "reload", {amount: params.amount, callbackUrl: params.callbackUrl}, params.callback);
			}
		},

		websale: {
			createTransaction: function(params){
				//var params = {itemsArray, funId, mail, returnUrl, callbackUrl}
				return payutcAPI.genericApiCall("WEBSALE","createTransaction", {items: params.itemsArray, fun_id: params.funId, mail:params.mail, return_url: params.returnUrl, callback_url: params.callbackUrl}, params.callback);
			},

			getTransactionInfo: function(params){
				//var params = funId, traId
				return payutcAPI.genericApiCall("WEBSALE", "getTransactionInfo", {fun_id: params.funId, tra_id: params.traId}, params.callback);
			}
		}
	
};

