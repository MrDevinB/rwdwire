$(function(){
	
	Width = Backbone.Model.extend({
		defaults: {max: "1200", min: "0"},
		getView: function () {
			return $(this).data("view");
		}
	});

	WidthView = Backbone.View.extend({
		className: "width-view",
		events: {
			"click" : "updateViewportWidth"
		},
		
		template: _.template($("#widthViewTemp").html()),
		initialize: function (options) {
			this.dispatch = options.dispatch;
			$(this.model).data("view", this);
		},
		dimension: function () {
			return this.model.get("max") - this.model.get("min");
		},
		updateViewportWidth: function () {

			this.dispatch.trigger("WidthView:click", {width: this.model.get("max")});
		},
		render: function () {
			this.$el.html(this.template(this.model.toJSON()));
			this.$el.width(this.dimension());
			return this;
		}
	});


	var WidthCollection = Backbone.Collection.extend({
		model : Width,
		initialize: function (models, options) {
		}
	});

	var WidthCollectionView = Backbone.View.extend({
		el: $("#sizes"),

		initialize: function(options) {
			this.dispatch = options.dispatch;
			this.render();
		},
		render: function () {
			_.each(this.collection.models, function (widthModel){
				this.addModelToView(widthModel);
			},this);
			return this;
		},
		updateViewportWidth: function (e) {

		},
		addModelToView: function (widthModel) {
			var tempView = new WidthView( {model: widthModel, dispatch: this.dispatch} );
			this.$el.append(tempView.render().el);
		}
	});

	Element = Backbone.Model.extend({
		currentState : "defaults",

		defaults: {
			width: "200",
			height: "200",
			x: "10",
			y: "10",
			type: "div",
			content: " a Div",
			bcolor: "blue"
		},

		updateCurrentState: function (width) {
			this.currentState = "s"+width.toString();
		}
	});

	ElementView = Backbone.View.extend({
		className: "element-view",
		//template: _.template($("#elementViewTemp").html()),
		attributes: {
			"draggable" : "true"
		},
		events: {
			"dragstart" : "collectDragInfo",
			"resizestop" : "updateDimension"
		},

		initialize: function (options) {
			this.dispatch = options.dispatch;
			this.listenTo(this.model, "change", this.render);
			this.render();
			this.$el.resizable({
				ghost: true
			});
			this.$el.css({ //Needs to be inline since everything else is inline.
				"-webkit-transition": "top 0.5s, left 0.5s, width 0.5s, height 0.5s", /* Safari and Chrome */
				"-moz-transition": "top 0.5s, left 0.5s, width 0.5s, height 0.5s", /* Firefox 4 */
				"-ms-transition": "top 0.5s, left 0.5s, width 0.5s, height 0.5s", /* MS */
				"-o-transition": "top 0.5s, left 0.5s, width 0.5s, height 0.5s", /* Opera */
				"transition": "top 0.5s, left 0.5s, width 0.5s, height 0.5s"
			});

		},
		updateDimension: function () {
			this.stopListening(this.model, "change");
			this.model.set("width", $(".ui-resizable-helper").width() );
			this.model.set("height", $(".ui-resizable-helper").height());
			this.render();
			this.listenTo(this.model, "change", this.render);

		},
		collectDragInfo: function (e) {
			var topVal = e.originalEvent.clientY - this.$el.position().top;
			var leftVal = e.originalEvent.clientX - this.$el.position().left;
			e.originalEvent.dataTransfer.setData("application/json",'{"top" :'+ topVal + ', "left": ' + leftVal + ', "id" : "' + this.model.cid + '" }');
		},

		render: function () {

			this.$el.width(this.model.get("width"));
			this.$el.height(this.model.get("height"));
			this.$el.position({left: this.model.get("x"), top: this.model.get("y")});
			this.$el.css({"background-color": this.model.get("bcolor") , "left" : this.model.get("x") , "top" : this.model.get("y")});
			return this;
		}
	});

	ElementsCollection = Backbone.Collection.extend({

	});

	ElementsCollectionView = Backbone.View.extend({
		el: $(".main-view"),
		width: "",
		events: {
			"dragover": "allowdrag",
			"drop" : "updateElementPosition"
		},
		initialize: function (options) {
			this.dispatch = options.dispatch;
			this.changeWidth(options.width);
			this.render();
			this.listenTo(this.collection, 'add', this.renderElement);
		},
		allowdrag: function (e) {
			e.preventDefault();
		},
		updateElementPosition: function (e) {
			var eventData = $.parseJSON(e.originalEvent.dataTransfer.getData("application/json"));
			this.collection.get(eventData.id).set('x', e.originalEvent.clientX - eventData.left).set('y', e.originalEvent.clientY - eventData.top);
		},
		renderElement: function (model , collection , options) {
			model.updateCurrentState(this.width);
			var modelView = new ElementView({model: model, dispatch: this.dispatch});
			this.$el.append(modelView.el);
		},
		changeWidth: function (width) {
			this.width = width;
			this.dispatch.trigger("ElementsCollectionView/width:change", {width: width});
			this.render();
		},
		render: function () {
			this.$el.width(this.width);
			return this;
		}
	});

	/** Executions **/
	var AppView = Backbone.View.extend({
		el: $("body"),

		initialize: function () {

			dispatch = _.clone(Backbone.Events);
			widths = [{max: "450"}, {min: "451", max: "750"}, {min: "751"}];
			widthCollection = new WidthCollection(widths);
			widthCollectionView = new WidthCollectionView({collection: widthCollection, dispatch: dispatch});
			elementsCollection = new ElementsCollection();
			elementsCollectionView = new ElementsCollectionView({collection: elementsCollection, dispatch: dispatch, width: widthCollection.first().get("max")});

			elementsCollection.add(new Element({state: elementsCollection.width}));
		},

		events: function () {
			dispatch.on("WidthView:click", this.updateViewportWidth);
			dispatch.on("ElementsCollectionView/width:change", this.updateElementsState);
		},

		updateViewportWidth: function (payload) {
			elementsCollectionView.changeWidth(payload.width);
		},

		updateElementsState: function (payload) {

			_.each(elementsCollection.models, function(model) {
				model.updateCurrentState(payload.width);
			});
		}
	});
	
	App = new AppView();
})