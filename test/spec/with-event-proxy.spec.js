'use strict';

describeMixin('lib/with-event-proxy', function () {

	beforeEach(function () {
		var targetDiv = $('<div><div class="div1"></div><div class="div2"></div></div>');
		setupComponent(targetDiv, {
			div1Selector: '.div1',
			div2Selector: '.div2'
		});
	});

	describe('eventType transform proxy', function () {
		it('transforms eventType', function () {
			var spy = jasmine.createSpy();
			this.component.on('targetEvent', spy);

			this.component.proxy('sourceEvent', this.component.makeProxy(
				this.component.eventTransform(function () {
	               	return 'targetEvent';
	            })
	        ));

			this.component.trigger('sourceEvent');
			expect(spy.calls.length).toBe(1);
		});
		it('transforms eventType based on data', function () {
			var spy = jasmine.createSpy();
			this.component.on('differentTargetEvent', spy);
			var data = {actor: 'Brent Spiner'};

			this.component.proxy('sourceEvent', this.component.makeProxy(
				this.component.eventBundleTransform(function (bundle) {
					bundle.event = 'targetEvent';
					if (bundle.data.actor === 'Brent Spiner') {
						bundle.event = 'differentTargetEvent';
					}
	               	return bundle;
	            })
	        ));

			this.component.trigger('sourceEvent', data);
			expect(spy.calls.length).toBe(1);
		});
		it('can unproxy', function () {
			var spy = jasmine.createSpy();
			this.component.on('targetEvent', spy);

			var proxy = this.component.makeProxy(
				this.component.eventTransform(function () {
	               	return 'targetEvent';
	            })
	        );

			this.component.proxy('sourceEvent', proxy);
			this.component.trigger('sourceEvent');
			expect(spy.calls.length).toBe(1);

			this.component.trigger('sourceEvent');
			expect(spy.calls.length).toBe(2);

			this.component.unproxy('sourceEvent', proxy);
			this.component.trigger('sourceEvent');
			expect(spy.calls.length).toBe(2);
		});
	});

	describe('makeProxy', function () {
		it('should throw when non-function passed in', function () {
			expect(function () {
				this.component.makeProxy('string', true);
			}.bind(this)).toThrow();
		});
	});

	describe('node transform proxy', function () {
		it('fires event on correct node', function () {
			var spy = jasmine.createSpy();
			var targetNode = this.component.select('div1Selector');
			this.component.on(targetNode, 'sourceEvent', spy);

			this.component.proxy('sourceEvent', this.component.makeProxy(
				this.component.nodeTransform(function () {
	               	return targetNode;
	            }.bind(this))
	        ));

	        this.component.trigger('sourceEvent');
	        expect(spy.calls.length).toBe(1);

		});
	});

	describe('data transform proxy', function () {
		it('transforms data', function () {
			var spy = jasmine.createSpy();
			this.component.on('sourceEvent', spy);
			var data = {actor: 'Brent Spiner'};

			this.component.proxy('sourceEvent', this.component.makeProxy(
				this.component.dataTransform(function (data) {
	               	return {
	               		actor: data.actor,
	               		rank: 'Lieutenant Commander'
	                };
	            })
	        ));

			this.component.trigger('sourceEvent', data);
			expect(spy.calls.length).toBe(2);
			expect(spy.calls[0].args[1]).toEqual({
				actor: data.actor
			});
			expect(spy.calls[1].args[1]).toEqual({
				actor: data.actor,
				rank: 'Lieutenant Commander'
			});
		});
		it('composes multiple transforms', function () {
			var spy = jasmine.createSpy();
			this.component.on('sourceEvent', spy);
			var data = {actor: 'Brent Spiner'};

			this.component.proxy('sourceEvent', this.component.makeProxy(
				this.component.dataTransform(function (data) {
	               	return {
	               		actor: data.actor,
	               		rank: 'Lieutenant Commander'
	                };
	            }),
	            this.component.dataTransform(function (data) {
	               	return {
	               		actor: data.actor,
	               		rank: data.rank + ', Sir'
	                };
	            })
	        ));

			this.component.trigger('sourceEvent', data);
			expect(spy.calls.length).toBe(2);
			expect(spy.calls[0].args[1]).toEqual({
				actor: data.actor
			});
			expect(spy.calls[1].args[1]).toEqual({
				actor: data.actor,
				rank: 'Lieutenant Commander, Sir'
			});
		});
	});

	describe('proxy listens on correct node', function () {
		it('listens on 1st arg node if passed in', function () {
			var spy = jasmine.createSpy();
			this.component.on(document, 'targetEvent', spy);

			this.component.proxy(document, 'sourceEvent', this.component.makeProxy(
				this.component.eventTransform(function () {
	               	return 'targetEvent';
	            })
	        ));

			this.component.trigger(document, 'sourceEvent');
			expect(spy.calls.length).toBe(1);
		});
		it('listens on 1st arg node and can proxy to component node', function () {
			var spy = jasmine.createSpy();
			this.component.on('targetEvent', spy);

			this.component.proxy(document, 'sourceEvent', this.component.makeProxy(
				this.component.eventTransform(function () {
	               	return 'targetEvent';
	            }),
	            this.component.nodeTransform(function () {
	            	return this.component.node;
	            }.bind(this))
	        ));

			this.component.trigger(document, 'sourceEvent');
			expect(spy.calls.length).toBe(1);
		});
	});

	describe('source event propagation', function () {
		it('does not occur by default', function () {
			var spy = jasmine.createSpy();
			this.component.on(document, 'sourceEvent', spy);

			this.component.proxy('sourceEvent', this.component.makeProxy(
				this.component.eventTransform(function () {
	               	return 'targetEvent';
	            })
	        ));

			this.component.trigger('sourceEvent');
			expect(spy).not.toHaveBeenCalled();
		});
		it('occurs when last arg is true', function () {
			var spy = jasmine.createSpy();
			this.component.on(document, 'sourceEvent', spy);

			this.component.proxy('sourceEvent', this.component.makeProxy(
				this.component.eventTransform(function () {
	               	return 'targetEvent';
	            }), true
	        ));

			this.component.trigger('sourceEvent');
			expect(spy.calls.length).toBe(1);
		});
	});

	describe('sugar for eventTarget to eventSource', function () {
		it('can proxy', function () {
			var data = {actor: 'Brent Spiner'};
			var spy = jasmine.createSpy();
			this.component.on('targetEvent', spy);

			this.component.proxy('sourceEvent', 'targetEvent');
			this.component.trigger('sourceEvent', data);
			expect(spy.calls.length).toBe(1);
			expect(spy.mostRecentCall.args[1]).toEqual(data);
		});
		it('can unproxy', function () {
			var spy = jasmine.createSpy();
			this.component.on('targetEvent', spy);

			this.component.proxy('sourceEvent', 'targetEvent');
			this.component.trigger('sourceEvent');
			expect(spy.calls.length).toBe(1);

			this.component.trigger('sourceEvent');
			expect(spy.calls.length).toBe(2);

			this.component.unproxy('sourceEvent', 'targetEvent');
			this.component.trigger('sourceEvent');
			expect(spy.calls.length).toBe(2);
		});
	});
});
