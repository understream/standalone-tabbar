if( !window.u$ ) {
    window.u$ = {};
}
var u$ = window.u$;
u$.tabbar = function( tab_bar_id, namespace ){
    var that = this;
    if( !that._tabbar_global_ctx ) 
    {
        that._tabbar_global_ctx = {};
    }
    if( !that._tabbar_namespace_ctx )
    {
        that._tabbar_namespace_ctx = {};
    }
    that.next_uniq_id_allocate = 1;

    function allocUniqId( )
    {
        return "u$" + (that.next_uniq_id_allocate++);
    }


    function addClass( dom, kls )
    {
        var old = dom.getAttribute("class") || "";
        var klses = old.split(" ").map( function( x ) { return x.trim() } ).filter( function( x ) { return x.length > 0 } );  
        if( klses.indexOf( kls ) >= 0 ) return;
        klses.push( kls );
        dom.setAttribute("class", klses.join(" ") );
    }

    function removeClass( dom, kls )
    {
        var old = dom.getAttribute("class") || "";
        var klses = old.split(" ").map( function( x ) { return x.trim() } ).filter( function( x ) { return x.length > 0 } ).filter( function( x ) { return x != kls } );
        dom.setAttribute("class", klses.join(" ") );
    }

    function setStyle( dom, attr, value )
    {
        var old = dom.getAttribute("style") || "";
        var attrs = old.split(";").map( function( x ) { return x.split(":").map( function( x ) { return x.trim() } ) } ) 
        var found = false;
        for( var i = 0 ; i < attrs.length ; i++ )
        {
            if( attrs[i][0].toUpperCase() == attr.toUpperCase() )
            {
                attrs[i][1] = value;
                found = true;
                break;
            }
        }
        if( !found ) attrs.push( [attr, value] );
        dom.setAttribute("style",attrs.filter(function(x){return x.length==2}).map( function( x ) { return x[0]+":"+x[1] } ).join(";"));
    }

    function clearStyle( dom, attr )
    {
        var old = dom.getAttribute("style") || "";
        var attrs = old.split(";").map( function( x ) { return x.split(":").map( function( x ) { return x.trim() } ) } ) 
        dom.setAttribute("style", attrs.filter( function( x ) { return x[0].toUpperCase() != attr.toUpperCase() } ).map( function( x ) { return x[0]+":"+x[1] } ).join(";") );
    }

    function adjustChildrenWidth( dom, recommended_min_tab_width )
    {
        var width = parseInt(getComputedStyle( dom ).width);
        var ch_width = width  / (dom.children.length + 1);
        if( ch_width < recommended_min_tab_width ) ch_width = recommended_min_tab_width;
        for( var i = 0 ; i < dom.children.length ; i++ )
        {
            setStyle( dom.children[i], "max-width", ch_width + "px" );
            setStyle( dom.children[i], "min-width", ch_width + "px" );
        }
        var placehodler_dom = dom.getElementsByClassName("insert-placeholder")[0];
        setStyle( placehodler_dom, "height", getComputedStyle( options.tabbar_dom ).height );
    }

    var _namespace = namespace || ("N_"+Date.now()+"_"+Math.random())
    if( !that._tabbar_namespace_ctx[_namespace] ) 
    {
        that._tabbar_namespace_ctx[_namespace] = {};
        that._tabbar_namespace_ctx[_namespace].tabbars = [];
    }
    var CONST = {
        NORMAL: 'normal',
        DRAGGING: 'dragging',

        START: 'start',
        DRAGEND: 'dragend',
        LEAVE: 'leave',

        DRAGCHILD: 'dragchild',
        LEAVECHILD: 'leavechild',
        RELEASECHILD: 'releasechild',

        ENTERME: 'enterme',
        LEAVEME: 'leaveme',
        INACTIVE: 'inactive',
        OVERME: 'overme',
        DROPONME: 'droponme',

        ACTIVECHILD: 'active-child',
        YOURCHILDLEAVE: 'your-child-leave',


        DATA_UNIQ_ID: 'ust-data-uniq-id',
        DATA_IS_TABBAR: 'ust-data-is-tabbar',
        DATA_IS_A_TAB: 'ust-data-is-a-tab',
        DATA_IS_PLACEHOLDER: 'ust-data-is-placeholder',
        DATA_IS_ACTIVE: 'ust-data-is-active',
        DATA_ACTIVE_CLASS_NAME: 'ust-data-active-class-name',


    };


    var TRANSITACTIONS = {};

    function setGlobalCurrentNamespace(  )
    {
        that._tabbar_global_ctx.current_namespace = _namespace;
    }

    function checkIfMyNamespace( )
    {
        return that._tabbar_global_ctx.current_namespace == _namespace;
    }

    function setNamespaceDraggingElement( org_elem )
    {
        that._tabbar_namespace_ctx[_namespace].elem_dragging = org_elem;
    }

    function getNamespaceDraggingElement( )
    {
        return that._tabbar_namespace_ctx[_namespace].elem_dragging;
    }

    function removeNamespaceDraggingElement( org_elem, handler, event_name, elem_context, transtable, org_event )
    {
        that._tabbar_namespace_ctx[_namespace].elem_dragging = null;
    }

    function removeGlobalCurrentNamespace( )
    {
        that._tabbar_global_ctx.current_namespace = '';
    }

    function sendInactiveIfNecessary( dom )
    {
        var old = that._tabbar_namespace_ctx[_namespace].active_tabbar;
        if( old && dom != old ) 
        {
            var message = {
                type: CONST.INACTIVE
            };
            old.onmessage( message );
        }

    }

    function registerMeAsActive( dom ) 
    {
        sendInactiveIfNecessary( dom );
        that._tabbar_namespace_ctx[_namespace].active_tabbar = dom;
    }

    function clearRegister( )
    {
        sendInactiveIfNecessary();
        that._tabbar_namespace_ctx[_namespace].active_tabbar = null;
    }

    function callParentWithMessage( message_type )
    {
        return function( org_elem, handler, event_name, elem_context, transtable, org_event )
        {
            var p = org_elem.parentElement;
            var message = {
                'type': message_type, 
                'from': org_elem,
                }
            p.onmessage( message )
        }
    }

    function stopBubbling( org_elem, handler, event_name, elem_context, transtable, org_event )
    {
        org_event.stopPropagation();
    }
    function preventDefault( org_elem, handler, event_name, elem_context, transtable, org_event )
    {
        org_event.preventDefault();
    }

    function childrenForEach( tabbar_dom, cb )
    {
        for( var i = 0 ; i < tabbar_dom.children.length ; i++ )
        {
            cb( tabbar_dom.children[i] );
        }
    }



    function childrenFilter( tabbar_dom, filter_cb )
    {
        var res = [];
        function cb_forEach( dom )
        {
            if( filter_cb( dom ) ) res.push( dom );
        }
        childrenForEach( tabbar_dom, cb_forEach );
        return res;
    }

    function findIndexOfTab( tabbar_dom, tab_elem )
    {
        var idx = 0;
        var ret = -1;
        function cb_forEach( dom )
        {
            if( tab_elem.getAttribute( CONST.DATA_UNIQ_ID ) === dom.getAttribute( CONST.DATA_UNIQ_ID ) ) ret = idx;
            if( dom.getAttribute( CONST.DATA_IS_A_TAB ) === CONST.DATA_IS_A_TAB ) idx += 1;
        }
        childrenForEach( tabbar_dom, cb_forEach );
        return ret;
    }

    function defauleHandler( event_desp ) 
    {
        return function( which_tabbar, ...any )
        {
            console.warn( which_tabbar, which_tabbar.getTabbar(), ...any, 'bind your own `' + event_desp + '` to handle your logic' );
        }
    }


    var parent_ctx = {};

    // event, next_state, functions
    var TRANSTABLE = {
        [CONST.NORMAL]: {
            [CONST.START]: [CONST.DRAGGING,[callParentWithMessage(CONST.DRAGCHILD)]],
            [CONST.LEAVE]: [CONST.NORMAL,[callParentWithMessage(CONST.LEAVECHILD), stopBubbling]],
            [CONST.CLICK]: [CONST.NORMAL,[callParentWithMessage(CONST.ACTIVECHILD)]],
        },
        [CONST.DRAGGING]: {
            [CONST.DRAGEND]: [CONST.NORMAL,[callParentWithMessage(CONST.RELEASECHILD), sendInactiveIfNecessary]],
        },

    };
    function applyTransition( org_elem, handler, event_name, elem_context, org_event, transtable )
    {
        if( !transtable ) transtable = TRANSTABLE;
        //if( !(org_elem.getAttribute( CONST.DATA_IS_A_TAB ) === CONST.DATA_IS_A_TAB) ) return;
        var current_state = elem_context.state;
        var next = transtable[ current_state ][ event_name ];
        if( !next ) return;
        var next_state = next[0];
        var next_funs = next[1];
        elem_context.state = next_state;

        for( var i = 0 ; i < next_funs.length ; i++ )
        {
            next_funs[i]( org_elem, handler, event_name, elem_context, transtable, org_event );
        }
    }

    function install_handlers( elem, handler, ctx )
    {
        elem.ctx = ctx;
        elem.ondragstart = handle_event( handler, CONST.START, ctx );
        elem.ondragend = handle_event( handler, CONST.DRAGEND, ctx );
        elem.onclick = handle_event( handler, CONST.CLICK, ctx );
        elem.ondropdown = handle_event( handler, CONST.DROPEND, ctx );
    }
    function clear_handlers( elem )
    {
        elem.ctx = null;
        elem.ondragstart = null;
        elem.ondragend = null;
        elem.onclick = null;
        elem.ondropdown = null;
    }

    function handle_event( handler, event_name, elem_context )
    {
        return function( event )
        {
            var which = event.srcElement;
            while( which && which.parentElement )
            {
                if( which.getAttribute( CONST.DATA_IS_A_TAB ) === CONST.DATA_IS_A_TAB ) break;
                which = which.parentElement;
            }
            applyTransition( which, handler, event_name, elem_context, event );
        }
    }

    function find_tab_elem_belong( dom )
    {
        while( dom && dom.parentElement )
        {
            if( dom.getAttribute( CONST.DATA_IS_PLACEHOLDER ) === CONST.DATA_IS_PLACEHOLDER ) break;
            if( dom.getAttribute( CONST.DATA_IS_TABBAR ) === CONST.DATA_IS_TABBAR ) break;
            if( dom.getAttribute( CONST.DATA_IS_A_TAB ) === CONST.DATA_IS_A_TAB ) break;
            dom = dom.parentElement;
        }
        return dom;
    }


    //window.$setStyle = setStyle;
    //window.$clearStyle = clearStyle;

    //tab: 'title', 'id', '$options':
    var tabs = [];
    var options = {
        tab_active_class: null,
        tab_template_html: null,
    };
    var parentContext
    var _handler;
    var handler = {
        init: function( recommended_min_tab_width )
        {
            options.tabbar_dom = document.getElementById( tab_bar_id );
            options.recommended_min_tab_width = recommended_min_tab_width ? recommended_min_tab_width : 40;
            that._tabbar_namespace_ctx[_namespace].tabbars.push( options.tabbar_dom );
            //setStyle( options.tabbar_dom, "float","left");
            setStyle( options.tabbar_dom, "white-space", "nowrap" );
            setStyle( options.tabbar_dom, "overflow-x", "scroll");
            setStyle( options.tabbar_dom, "overflow-y", "hidden");
            setStyle( options.tabbar_dom, "-ms-overflow-style", "none");  /* Internet Explorer 10+ */
            setStyle( options.tabbar_dom, "scrollbar-width", "none" ); /* firefox */
            setStyle( options.tabbar_dom, "height", "auto" );
            options.tabbar_dom.setAttribute( CONST.DATA_IS_TABBAR, CONST.DATA_IS_TABBAR );

            var placehodler_dom = options.tabbar_dom.getElementsByClassName( "insert-placeholder" )[0];
            if( !placehodler_dom )
            {
                placehodler_dom = document.createElement("div");
                addClass( placehodler_dom, "insert-placeholder" );
                setStyle( placehodler_dom, "outline", "5px dashed black" );
                setStyle( placehodler_dom, "outline-offset", "-10px" );
                setStyle( placehodler_dom, "width", options.recommended_min_tab_width + "px" );
                setStyle( placehodler_dom, "height", "auto" );//getComputedStyle( options.tabbar_dom ).height );
                options.tabbar_dom.appendChild( placehodler_dom );
            }
            setStyle( placehodler_dom, "display", "none" );
            placehodler_dom.setAttribute( CONST.DATA_IS_PLACEHOLDER, CONST.DATA_IS_PLACEHOLDER );

            options.tabbar_dom.setAttribute("droppable", "true");

            options.tabbar_dom.ondragenter = function( ev )
            {
                var message = {
                    'type': CONST.ENTERME,
                    'from': find_tab_elem_belong( ev.target ),
                    'org': ev,
                }
                options.tabbar_dom.onmessage( message )
            }

            options.tabbar_dom.ondragleave = function( ev )
            {
                var message = {
                     'type': CONST.LEAVEME,
                     'from': find_tab_elem_belong( ev.target ),
                };
                if( ev.target != options.tabbar_dom ) return;
                options.tabbar_dom.onmessage( message )
            }

            options.tabbar_dom.ondragover = function( ev )
            {
                ev.preventDefault();
                var message = {
                    'type': CONST.OVERME,
                    'from': find_tab_elem_belong( ev.target ),
                };
                options.tabbar_dom.onmessage( message );
            }

            options.tabbar_dom.ondrop = function( ev )
            {
                var message = {
                    'type': CONST.DROPONME
                }
                options.tabbar_dom.onmessage( message );
            }

            
            var dbg_cnt = 0;

            options.tabbar_dom.onmessage = function( message )
            {
                var td = options.tabbar_dom;
                if( message.type == CONST.DRAGCHILD )
                {
                    setGlobalCurrentNamespace()
                    setNamespaceDraggingElement( message.from );
                }
                else if( message.type == CONST.ENTERME || message.type == CONST.OVERME )
                {
                    if( checkIfMyNamespace() )
                    {
                        var pl = td.getElementsByClassName("insert-placeholder")[0];
                        setStyle( pl, "display", "inline-block" );
                        if( message.from === td )
                        {
                            td.appendChild( pl );
                        }
                        else
                        {
                            td.insertBefore( pl, message.from );
                        }

                        registerMeAsActive( td );
                        
                        if( message.from === pl )
                        {
                            td.ignoreNextLeave = true;
                        }
                    }
                    /*
                    else
                    {
                    }
                    */
                }
                else if( message.type == CONST.INACTIVE )
                {
                    var pl = td.getElementsByClassName("insert-placeholder")[0];
                    setStyle( pl, "display", "none" );
                }
                else if( message.type == CONST.LEAVEME )
                {
                    if( td.ignoreNextLeave ) 
                    {
                        td.ignoreNextLeave = false;
                        return;
                    }
                    var pl = td.getElementsByClassName("insert-placeholder")[0];
                    setStyle( pl, "display", "none" );
                }
                else if( message.type == CONST.RELEASECHILD )
                {

                }
                else if( message.type == CONST.ACTIVECHILD )
                {
                    var old = message.from.getAttribute( CONST.DATA_IS_ACTIVE );
                    if( old === CONST.DATA_IS_ACTIVE ) return; // do nothing

                    var current_actives = childrenFilter( options.tabbar_dom, function( dom ) { return dom.getAttribute( CONST.DATA_IS_ACTIVE, CONST.DATA_IS_ACTIVE ) } );
                    current_actives.forEach( function( dom ) {
                            dom.setAttribute( CONST.DATA_IS_ACTIVE, "" );
                            dom.setAttribute( CONST.DATA_ACTIVE_CLASS_NAME, "" );
                            if( options.tab_active_class )
                                removeClass( dom, options.tab_active_class )
                            } );
                    message.from.setAttribute( CONST.DATA_IS_ACTIVE, CONST.DATA_IS_ACTIVE );
                    if( options.tab_active_class ) 
                    {
                        addClass( message.from, options.tab_active_class );
                        message.from.setAttribute( CONST.DATA_ACTIVE_CLASS_NAME, options.tab_active_class );
                    }
                    _handler.onActiveTabChanged( _handler );

                }
                else if( message.type == CONST.DROPONME )
                {
                    if( checkIfMyNamespace() )
                    {
                        var pl = td.getElementsByClassName("insert-placeholder")[0];
                        setStyle( pl, "display", "none" );
                        var elem = getNamespaceDraggingElement( );
                        if( elem )
                        {
                            var send_child_leave = (elem.parentElement != options.tabbar_dom);
                            var elem_is_active  = elem.getAttribute( CONST.DATA_IS_ACTIVE ) === CONST.DATA_IS_ACTIVE ;
                            var old_parent = elem.parentElement;
                            td.insertBefore( elem, pl );
                            if( send_child_leave && elem_is_active )
                            {
                                elem.setAttribute( CONST.DATA_IS_ACTIVE, "" );
                                if( elem.getAttribute( CONST.DATA_ACTIVE_CLASS_NAME ).length > 0 )
                                {
                                    removeClass( elem, elem.getAttribute( CONST.DATA_ACTIVE_CLASS_NAME ) );
                                    elem.setAttribute( CONST.DATA_ACTIVE_CLASS_NAME, "" );
                                }
                            }
                            _handler.onTabsChanged( _handler );
                            if( send_child_leave )
                            {
                                _handler.onTabAdded( _handler, findIndexOfTab( options.tabbar_dom, elem ) );
                                var msg = {
                                    type: CONST.YOURCHILDLEAVE,
                                    child_is_active: elem_is_active,
                                    child_tab: elem,
                                };
                                old_parent.onmessage( msg );
                            }
                        }
                        removeNamespaceDraggingElement();
                        removeGlobalCurrentNamespace();
                    }
                }
                else if( message.type == CONST.YOURCHILDLEAVE )
                {
                    _handler.onTabsChanged( _handler );
                    if( message.child_is_active )
                    {
                        _handler.onActiveTabChanged( _handler );
                    }
                    _handler.onTabRemoved( _handler, message.child_tab.bindData );
                }
            }

            //hide scroll bar
            var styleEle = document.createElement('style');
            styleEle.innerHTML = '#' + tab_bar_id + '::-webkit-scrollbar' + '{display:none}';
            document.body.appendChild( styleEle );

        },

        setTabTemplate: function( html )
        {
            options.tab_template_html = html;
        },


        // OPERATIONS START
        addTab: function( text, data ) {
            var newTab = document.createElement('div');


            setStyle(newTab,"display","inline-block");
            //setStyle(newTab,"max-width","200px");
            //setStyle(newTab,"height",getComputedStyle( options.tabbar_dom ).height );
            setStyle(newTab,"white-space","nowrap");
            setStyle(newTab,"overflow","hidden");
            setStyle(newTab,"text-overflow","ellipsis");

            newTab.setAttribute("draggable", "true");
            newTab.setAttribute(CONST.DATA_IS_A_TAB, CONST.DATA_IS_A_TAB);
            newTab.setAttribute(CONST.DATA_UNIQ_ID, allocUniqId() );

            //bind events
            var ctx = {'state': CONST.NORMAL};
            install_handlers( newTab, this, ctx );

            newTab.bindData = {};
            if( data ) newTab.bindData.data = data;
            else newTab.bindData.data = {};
            newTab.bindData.DOM = newTab;

            options.tabbar_dom.appendChild( newTab );

            //setup inner
            if( options.tab_template_html )
            {
                newTab.innerHTML = options.tab_template_html;
                var title_doms = newTab.getElementsByClassName("tab-title");
                if( title_doms.length == 0 )
                {
                    console.warn( 'Found no DOM with class `tab-title` to put text' );
                }
                else if( title_doms.length > 1 )
                {
                    console.warn( 'There are too many `tab-title` DOMs' );
                }
                else 
                {
                    title_doms[0].innerHTML = text;
                }
            }
            else
            {
                newTab.innerHTML = text;
            }


            adjustChildrenWidth( options.tabbar_dom, options.recommended_min_tab_width );
            _handler.onTabsChanged( _handler );
            _handler.onTabAdded( _handler, findIndexOfTab( options.tabbar_dom, newTab ) );
            return newTab;
        },

        removeTabAt: function( index ) {
            var ret = this.getCurrentTabsData();
            if( ret.length <= index ) return;

            var dom = ret[index].DOM;
            if( dom.getAttribute( CONST.DATA_IS_ACTIVE ) == CONST.DATA_IS_ACTIVE )
            {
                dom.setAttribute( CONST.DATA_IS_ACTIVE, "" );
                _handler.onActiveTabChanged( _handler );
            }
            dom.setAttribute( CONST.DATA_IS_A_TAB, "" );
            clear_handlers( dom );
            setStyle( dom, "display", "none" );
            _handler.onTabRemoved( _handler, dom.bindData );
            _handler.onTabsChanged( _handler );
            //dom.remove();

        },
        // OPERATIONS END

        //STYLING START
        setTabActiveClass: function( kls )
        {
            options.tab_active_class = kls;
        },
        //STYLING END

        
        //GETTERS START
        getTabbar: function() {
            return options.tabbar_dom;
        },

        getTabDataAt: function( index ) {
            var res = this.getCurrentTabsData();
            return res[index];
        },

        getCurrentTabsData: function() {
            return childrenFilter( options.tabbar_dom, function( dom ) {
                return dom.getAttribute( CONST.DATA_IS_A_TAB ) === CONST.DATA_IS_A_TAB; }  
             ).map( function( dom ) { return dom.bindData } )
        },

        getCurrentActiveIndex: function() {
            var tab_doms = childrenFilter( options.tabbar_dom, function( dom ) {
                return dom.getAttribute( CONST.DATA_IS_A_TAB ) === CONST.DATA_IS_A_TAB;
            } );
            for( var i = 0 ; i < tab_doms.length ; i++ )
            {
                if( tab_doms[i].getAttribute( CONST.DATA_IS_ACTIVE ) === CONST.DATA_IS_ACTIVE ) return i;
            }
            return -1;
        },

        //GETTERS END


        //handlers
        onTabsChanged: defauleHandler( 'onTabsChanged' ),

        onActiveTabChanged: defauleHandler( 'onActiveTabChanged' ),

        //TODO: test this
        onTabAdded: defauleHandler( 'onTabAdded' ),

        onTabRemoved: defauleHandler( 'onTabRemoved' ),


    };

    _handler = handler;
    return handler;
    
};
