/*!
 * SPDX-FileCopyrightText: 2020 Benedict Harcourt
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

'use strict';

type EventListener = (this: Element, ev: Event) => any;
type AttrArgs = { [k: string]: string | boolean | null | EventListener }
type ValidArgs = null | string | Node | Attr | AttrArgs
type NestedArgs = ValidArgs | NestedArgs[]

/**
 * elemGenerator is a function-generator which outputs functions
 * for generating DOM elements via a more concise interface.
 *
 * Calls to elemGenerator specify a tag name and, optionally, a namespace
 * and yield a function that will generate DOM elements of that type.
 *
 * The returned function takes any number of arguments of different
 * types, and builds up the element according to them.
 *
 * Null:
 *   Any null values supplied in the argument list are ignored. This can be
 *   used for conditionally including elements.
 *
 * Arrays:
 *   Any arrays supplied in the argument list are treated as additional
 *   arguments. This has a maximum nested of three layers deep.
 *
 * Strings:
 *   Strings are converted to text nodes in the document, and added to
 *   the element.
 *
 * Nodes/Elements/Attrs:
 *   Other DOM Nodes, including elements and attribute, supplied to this
 *   function will be added to the element via appendChild/setAttribute
 *   as appropriate to the type.
 *
 * Objects:
 *   Objects with iterable keys will be treated as attribute and event maps.
 *
 *   Values which are functions are treated as event handlers. This uses
 *   `addEventListener`, so the `on` part of the event name should not be
 *   a part of the key.
 *
 *   Other values are are coerced to strings and treated as attributes, with
 *   a few exceptions:
 *    - `null` causes no action to happen.
 *    - a boolean causes that value to be set without a value (true) or,
 *      the attribute to be removed (false).
 *    - objects and array cause an exception.
 *
 * Providing any other type in an argument will result in an exception being
 * thrown.
 *
 * Example 1 - A quick list
 * ========================
 *
 * In this example, we're going to create a <ul> with four items, which have
 * example of text, event handling, styling, and nesting.
 *
 * const ul = elemGenerator('ul')
 * const li = elemGenerator('li')
 *
 * document.body.appendChild( ul(
 *   li( 'Hello' ),
 *   li( 'Click Me', { click: e => alert('Hi') } ),
 *   li( 'Don\'t Click Me', { click: e => alert('I said no'), style: 'color: red;' } ),
 *   li( 'Sub Set', ul (
 *       li( 'One', { 'data-foo': '1' } ),
 *       li( 'Two' ),
 *       li( 'Three' )
 *   ) )
 * ) );
 */
export function elemGenerator(tag: string, ns?: string): (...args: NestedArgs[]) => Element
{
	return ( ...args: NestedArgs[] ): Element =>
	{
		const elem = ns ? document.createElementNS( ns, tag ) : document.createElement( tag );

		args = args.flat( 3 );
		args.forEach( arg =>
		{
			if ( arg === null )
			{
				return;
			}
			else if ( arg instanceof Attr )
			{
				elem.setAttribute( arg.name, arg.value );
			}
			else if ( arg instanceof Node )
			{
				elem.appendChild( arg );
			}
			else if ( typeof arg === 'string' )
			{
				elem.appendChild( document.createTextNode( arg ) );
			}
			else if ( typeof arg === 'object' )
			{
				const attrs: AttrArgs = arg as AttrArgs;

				Object.keys( attrs ).forEach( key =>
				{
					const val: string | boolean | EventListener | Attr | null = attrs[key] || null;

					if ( val instanceof Function )
					{
						elem.addEventListener( key, val );
					}
					else if ( val === true )
					{
						elem.setAttribute( key, '' );
					}
					else if ( val === false )
					{
						elem.removeAttribute( key );
					}
					else if ( val === null )
					{
						return;
					}
					else if ( typeof val !== 'object' )
					{
						elem.setAttribute( key, val.toString() );
					}
					else
					{
						throw `Invalid type for attribute ${key} in element ${tag}`;
					}
				} );
			}
			else
			{
				throw `Invalid type in arguments for element ${tag}, arg was ${typeof arg}: ${arg}`;
			}
		} );

		return elem;
	};
}


/**
 * documentFragment is a helper function to generate Document Fragments in the
 * elems.js style.
 *
 * Example: A Custom Element template
 *
 *   const _h1 = elemGenerator( 'h1' );
 *   const _slot = elemGenerator( 'slot' );
 *
 *   const template = documentFragment(
 *     _h1( 'the title' )
 *     _slot(),
 *   );
 *
 *   class MyParagraph extends HTMLElement {
 *     constructor() {
 *       super();
 *       this.attachShadow( { mode: 'open' } );
 *       this.shadowRoot.appendChild( template.cloneNode( true ) );
 *     }
 *   };
 *
 * Example: Appending multiple nodes as a single DOM action
 *
 *   const _li = elemGenerator( 'li' );
 *   const items = documentFragment(
 *     [ 1, 2, 3 ].map( d => _li( d ) ),
 *   );
 *
 *   let list = document.querySelector( '#list' );
 *   list.appendChild( items );
 */
export function documentFragment( ...args: Node[] ): DocumentFragment
{
	const fragment = new DocumentFragment();

	args.forEach( arg => fragment.appendChild( arg ) );

	return fragment;
}
