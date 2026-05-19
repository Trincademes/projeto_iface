interface ICard {
     title?: string,
     size: keyof typeof tamanhos,
     style: keyof typeof estilos,
     children?: React.ReactNode,
     className?: string
}


const tamanhos = {
     sm: "w-full min-h-[24rem]"
} as const

const estilos = {
     white: "bg-white/92 text-slate-950 backdrop-blur-sm",
     auto: "bg-auto",
     gray: "bg-gray-500"
} as const


export default function Card({title, size, style, children, className = ""}:ICard){

     const tamanhoAtivo = tamanhos[size]
     const estiloAtivo = estilos[style]

     return(
          <article className={`rounded-[2rem] border border-white/60 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.18)] ${tamanhoAtivo} ${estiloAtivo} ${className}`}>
               {title && <h1 className="text-xl font-black tracking-tight text-balance">{title}</h1>}
               {children}
          </article>
     )
}
