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
	
	console.log(today);
	return today;
}


var payutcAPI = {
	config: {
		url : "https://api.nemopay.net/services/",
		username : "colinajo",
		password : "Tennis15",
		systemID : "payutc",
		async: false,
		app_key: "44682eb98b373105b99511d3ddd0034f", 
		fun_id: 2,
		sessionID : 0,
		logged_usr : "",
	},



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
			console.info("Logged user successfully: ", this.logged_usr);
			return resp;
		}else{
			throw new Error("Error logging in: " + resp.error.message);
		}
	},



	verifySession: function() {
		if (this.config.sessionID == 0){
			console.warn("User not logged, logging...");
			return this.loginPayutcUser(this.config.username, this.config.password);
		}
		console.info("User already logged, session_id is: ", this.config.sessionID);
	},


	genericApiCall: function(service, method, data) {
		this.verifySession();
		var url = this.config.url + service + "/" + method + "?system_id=" + this.config.systemID + "&sessionid=" + this.config.sessionID + "&app_key=" + this.config.app_key;
		var xml = new XMLHttpRequest();
		if (typeof data != "undefined"){
			xml.open("POST", url, this.config.async);
			xml.setRequestHeader("Content-type", "application/json");
			xml.send(JSON.stringify(data)); //session_id: this.sessionID
		}else{
			xml.open("POST", url, this.config.async);
			xml.send();
		}
		console.log("URL Sent: ", url);
		console.log("Data sent: ", String(data));
		console.log("ResponseText: ", xml.responseText);	
		return xml.responseText;
	}

};



//This is the object that will contain all services
//and all methods in payutc's api.
//ex: payutc.stats.getNbSell(obj_id);
var payutc = {
	/**********
	// STATS
	**********/
	config:{
		//use to make setter functions
		//to modify payutcAPI config 
		
	},

	stats: {
		getNbSell : function(objId){
			return payutcAPI.genericApiCall("STATS", "getNbSell", {obj_id: objId, fun_id: payutcAPI.config.fun_id});
		},

		getRevenue: function(funId, start, end, tick, appId){
			//appId , start, end, tick are optional
			return payutcAPI.genericApiCall("STATS", "getRevenue", {fun_id: funId, app_id: appId || "0", start: start || "1999-01-01T00:00", end: end || "2060-01-01T00:00", tick: tick || "null"});
		},


		
	},

	transfer: function(amount, usr_id, message){
		return payutcAPI.genericApiCall("TRANSFER", "transfer", {amount: amount, userID: usr_id, message: message});
	},


	/*******************
	// GESTION ARTICLES
	*******************/
	articles: {
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
			//objId and parentId is optional
			return payutcAPI.genericApiCall("GESARTICLE", "setCategory", {name: name, parent_id: parentId || "null", fun_id: funId, obj_id: objId || "null"});
		}, 

		deleteCategory: function(catId, funId){
			//on est obliges d'eliminer les articles en cascade
			//pour cela on recup tous les articles de la fun 
			//vu que getProductsByCategory nexiste plus
			//et on compare le category_id de l'article avec catId
			//a eliminer, si ce sont les memes, le produit est elimine

			//solution degueulasse parce que synchrone est tres lente
			//si on suppose 200 ms pour l'elimination d'un article
			//on aura 2 sec d'attente pour 10 (ex: bieres bouteille)
			var prod = this.getProducts([payutcAPI.config.fun_id]);
			prod = JSON.parse(prod);
			for (var i =0 ; i< prod.length; i++){
				if (Number(prod[i].categorie_id) == catId){
					this.deleteProduct(prod[i].id, payutcAPI.config.fun_id);
				}
			}

			return payutcAPI.genericApiCall("GESARTICLE", "deleteCategory", {obj_id: catId, fun_id: funId});
		},

		getProduct : function(objId, funId){
			return payutcAPI.genericApiCall("GESARTICLE", "getProduct", {obj_id: objId, fun_id: funId || "null"});
		},

		getProductsByCategory: function(funIdsArray){
			// funIds as array
			var prods = [], cats = [];
			prod = JSON.parse(this.getProducts(funIdsArray));
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

			return resp;

		},

		setProduct: function(name, category, price, stock, alcool, image, funId, objId, tva, cotisant){
			//objId, tva and cotisant are optional
			//prix en centimes!!!
			if (alcool == true) alcool = 0;
			if (alcool == false) alcool =1;
			return payutcAPI.genericApiCall("GESARTICLE", "setProduct", {name: name, parent: category, prix: price, stock: stock, alcool: alcool, 
				image: image, fun_id: funId, obj_id: objId || "0", tva: tva || "0.00", cotisant: cotisant || "1"});
		},

		deleteProduct: function(objId, funId){
			return payutcAPI.genericApiCall("GESARTICLE", "deleteProduct",{obj_id: objId, fun_id: funId});
		}, 

	
	},

	reload: {
		info:function(){
			return payutcAPI.genericApiCall("RELOAD", "info");
		}
	}

}; 

function runTest () {
	// payutc.articles.getProducts([payutcAPI.config.fun_id]); //retour en tableau
	// payutc.stats.getNbSell(32);
	// payutc.articles.getCategories([payutcAPI.config.fun_id]);
	// payutc.articles.getCategory(8, payutcAPI.config.fun_id);
	// var cat = payutc.articles.setCategory("Categorie de Jo", payutcAPI.config.fun_id);
	// payutc.articles.setProduct("Produit de Jo", JSON.parse(cat).success, 345, 100, false, 0, payutcAPI.config.fun_id);
	// payutc.articles.deleteCategory(3657,2);
	payutc.stats.getRevenue(payutcAPI.config.fun_id, "2015-04-01 10:00:00", timeInSQL());
	// payutc.articles.getProductsByCategory([payutcAPI.config.fun_id]);
	// payutc.transfer(1, 10269, "Poulet3000");

}
