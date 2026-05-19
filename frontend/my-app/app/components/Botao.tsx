interface IBotao{
     nome: string,
     estilo: keyof typeof estilos,
     onClick: ()=>void
}

const estilos = {
     deletar: "bg-linear-to-r from-rose-500 to-orange-500 text-white hover:from-rose-400 hover:to-orange-400",
     confirmar: "bg-linear-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400"
}

export default function Botao({nome, estilo, onClick}:IBotao){

     const estiloAtivo = estilos[estilo]

     return(
          <button
          type="button"
          onClick = {onClick}
          className={`inline-flex min-h-11 items-center justify-center rounded-full px-5 py-3 text-sm font-bold shadow-lg shadow-slate-950/20 transition duration-200 cursor-pointer ${estiloAtivo}`}
          >
               {nome}
          </button>
     )
}
