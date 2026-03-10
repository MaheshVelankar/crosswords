(function($){

    let activeInput = null;
    let shiftOn = false;

    const VK_LAYOUT = {
        default: [
            [
                {n:"`", s:"~"},
                {n:"1", s:"!"},
                {n:"2", s:"@"},
                {n:"3", s:"#"},
                {n:"4", s:"$"},
                {n:"5", s:"%"},
                {n:"6", s:"^"},
                {n:"7", s:"&"},
                {n:"8", s:"*"},
                {n:"9", s:"("},
                {n:"0", s:")"},
                {n:"-", s:"_"},
                {n:"=", s:"+"},
                {action:"backspace", label:"⌫"}
            ],
            [
                {n:"q", s:"Q"},
                {n:"w", s:"W"},
                {n:"e", s:"E"},
                {n:"r", s:"R"},
                {n:"t", s:"T"},
                {n:"y", s:"Y"},
                {n:"u", s:"U"},
                {n:"i", s:"I"},
                {n:"o", s:"O"},
                {n:"p", s:"P"},
                {n:"[", s:"{"},
                {n:"]", s:"}"},
                {n:"\\", s:"|"}
            ],
            [
                {n:"a", s:"A"},
                {n:"s", s:"S"},
                {n:"d", s:"D"},
                {n:"f", s:"F"},
                {n:"g", s:"G"},
                {n:"h", s:"H"},
                {n:"j", s:"J"},
                {n:"k", s:"K"},
                {n:"l", s:"L"},
                {n:";", s:":"},
                {n:",", s:"\""},
                {action:"enter", label:"⏎", n:"⏎", s:"↵"}
            ],
            [
                {action:"shift", label:"⇧"},
                {n:"z", s:"Z"},
                {n:"x", s:"X"},
                {n:"c", s:"C"},
                {n:"v", s:"V"},
                {n:"b", s:"B"},
                {n:"n", s:"N"},
                {n:"m", s:"M"},
                {n:",", s:"<"},
                {n:".", s:">"},
                {n:"/", s:"?"}
            ]
        ]
    };

    function buildKeyboard(layout){
        console.log('in buildKeyboard');
        if($("#virtualKeyboard").length) return;
        console.log('in buildKeyboard has to build rows ', layout.length);

        let kb = $('<div id="virtualKeyboard"></div>');

        layout.forEach(row=>{

            let rowDiv = $('<div class="vk-row"></div>');

            row.forEach(key=>{

                let btn = $('<button class="vk-key"></button>')
                console.log('n', key.n, 'shift', key.s, 'label', key.label, 'action', key.action);

                if(key.action){
                    console.log('will put action', key.action);
                    btn.text(key.n?key.n:key.label);
                    btn.data("action",key.action);
                    if (key.n) btn.data("normal",key.n);
                    if (key.s) btn.data("shift",key.s);
                    console.log('put action', btn.data('action'));
                } else if(key.n){
                    btn.text(key.n);
                    btn.data("normal",key.n);
                    btn.data("shift",key.s);
                }
                rowDiv.append(btn)
            })
            kb.append(rowDiv);
        })
        $("body").append(kb);
    }

    function updateLabels(){

        $(".vk-key").each(function(){

            let n=$(this).data("normal");
            let s=$(this).data("shift");

            if(!n) return;

            $(this).text(shiftOn ? s : n);

        })
    }

    function createKeyboard_old(){

        if($("#virtualKeyboard").length) return;
        /*
        let keyboard = `
<div id="virtualKeyboard">

<div class="vk-row">
<button data-key="Q">Q</button>
<button data-key="W">W</button>
<button data-key="E">E</button>
<button data-key="R">R</button>
<button data-key="T">T</button>
<button data-key="Y">Y</button>
<button data-key="U">U</button>
<button data-key="I">I</button>
<button data-key="O">O</button>
<button data-key="P">P</button>
</div>

<div class="vk-row">
<button data-key="A">A</button>
<button data-key="S">S</button>
<button data-key="D">D</button>
<button data-key="F">F</button>
<button data-key="G">G</button>
<button data-key="H">H</button>
<button data-key="J">J</button>
<button data-key="K">K</button>
<button data-key="L">L</button>
</div>

<div class="vk-row">
<button data-key="Z">Z</button>
<button data-key="X">X</button>
<button data-key="C">C</button>
<button data-key="V">V</button>
<button data-key="B">B</button>
<button data-key="N">N</button>
<button data-key="M">M</button>
<button data-action="backspace">⌫</button>
</div>

</div>
`;

        $("body").append(keyboard);
        */

    }

    /* plugin definition */

    $.fn.virtualKeyboard = function(){

        //createKeyboard();
        buildKeyboard(VK_LAYOUT.default);

        let inputs = this;

        /* focus */

        inputs.on("focus", function(){
            activeInput = this;
            $("#virtualKeyboard").show();
        });

        /* typing */
        $(document).on("click",".vk-key",function(){

            if(!activeInput) return

            let action = $(this).data("action")

            console.log('clicked on action', $(this).data('action'));

            if(action=="shift"){
                shiftOn = !shiftOn
                updateLabels()
                return
            }

            if(action=="backspace"){
                let v=$(activeInput).val()
                $(activeInput).val(v.slice(0,-1))
                return
            }

            let char = shiftOn
                ? $(this).data("shift")
                : $(this).data("normal")

            let val = $(activeInput).val()

            $(activeInput).val(val + char)
            shiftOn = false;
            updateLabels()
        });
        /*
        $(document).on("click","#virtualKeyboard button[data-key]",function(){
            if(!activeInput) return;
            let char = $(this).data("key");
            let val = $(activeInput).val();
            $(activeInput).val(val + char);
        });
        */
        /* backspace */
        /*
            $(document).on("click","#virtualKeyboard button[data-action='backspace']",function(){
            if(!activeInput) return;
            let val = $(activeInput).val();
            $(activeInput).val(val.slice(0,-1));
        });
        */
    };
})(jQuery);
