import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { IconArrowLeft } from '@tabler/icons-react'

export const TermsPage = () => {
  const navigate = useNavigate()

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="animate-fade-in-up -mx-5 -my-6 space-y-6 px-5 py-6 sm:-my-8 sm:py-8 lg:-mx-46 lg:px-10">
      {/* Back button container - aligned with the card */}
      <div className="mx-auto flex w-full max-w-5xl justify-start">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          icon={<IconArrowLeft className="h-4 w-4" />}
          className="border-primary-300 text-primary-800 hover:bg-primary-50 bg-white/40 shadow-sm backdrop-blur-sm"
        >
          Go Back
        </Button>
      </div>

      {/* Main Content Area - Widened card to max-w-5xl */}
      <article className="border-primary-200/40 mx-auto mb-8 w-full max-w-5xl rounded-2xl border bg-white/40 p-6 shadow-sm backdrop-blur-sm md:p-10">
        <h1 className="text-primary-950 mb-2 text-3xl font-extrabold tracking-tight lg:text-4xl">
          Terms of Use
        </h1>
        <p className="text-primary-900/60 mb-8 text-xs font-semibold tracking-wider uppercase">
          Last Updated: May 26, 2026
        </p>

        <div className="text-primary-900/90 space-y-6 text-justify text-sm leading-relaxed md:text-base">
          <p>
            In these Terms of Use, any use of the words &ldquo;you&rdquo;, &ldquo;yours&rdquo; or
            similar expressions shall mean any user of this website whatsoever. Terms such as
            &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo; or similar expressions shall mean
            the SDOptimizer project team.
          </p>

          <p>
            This website is operated by the SDOptimizer project team. SDOptimizer is an academic and
            research platform designed to parse, simulate, and optimize System Dynamics models.
          </p>

          <p>
            Please read this page carefully as it sets out the terms that apply to your use of
            SDOptimizer, and any part of its content and all materials appearing on it. By using
            SDOptimizer, you confirm that you accept these Terms of Use and you agree to comply with
            them. If you do not agree to these Terms of Use, please refrain from using SDOptimizer.
          </p>

          <h2 className="text-primary-950 pt-4 text-xs font-bold tracking-wider uppercase">
            MODEL UPLOADS AND INTELLECTUAL PROPERTY RIGHTS
          </h2>

          <p>
            SDOptimizer was developed at the <strong>Universidad de Antioquia</strong> (UdeA).
          </p>

          <p>
            By uploading any System Dynamics models (specifically Vensim &ldquo;.mdl&rdquo; files),
            parameters, or configurations to this platform, you acknowledge and agree that all
            uploaded files and generated products are made available for public, academic, and
            research use. Any model or configuration uploaded to SDOptimizer becomes public domain
            and can be accessed, downloaded, and shared publicly.
          </p>

          <p>
            The models and parameter configurations you upload are processed specifically to train
            the reinforcement learning agents and validate the mathematical operation of the
            simulation engine. We commit to processing this data responsibly; your files will only
            be used for these optimization and validation tasks, ensuring they are not misused,
            exploited, or distributed for unauthorized commercial applications.
          </p>

          <h2 className="text-primary-950 pt-4 text-xs font-bold tracking-wider uppercase">
            CREATIVE COMMONS LICENSE
          </h2>

          <div className="bg-primary-50/50 border-primary-200/40 flex flex-col items-start gap-4 rounded-xl border p-5 sm:flex-row">
            <a
              href="https://co.creativecommons.net/tipos-de-licencias/"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <img
                src="/by-nd.png"
                alt="Creative Commons License (CC BY-NC-ND)"
                className="h-10 transform object-contain opacity-90 transition-opacity duration-200 hover:scale-105 hover:opacity-100 sm:self-center"
              />
            </a>
            <p className="text-primary-900/80 text-justify text-sm leading-relaxed">
              Esta plataforma está bajo la licencia{' '}
              <strong>CC Atribución – No comercial – Sin Derivar</strong>. Esta licencia es la más
              restrictiva de las seis licencias principales, sólo permite que otros puedan descargar
              las obras y compartirlas con otras personas, siempre que se reconozca su autoría, pero
              no se pueden cambiar de ninguna manera ni se pueden utilizar comercialmente.
            </p>
          </div>

          <h2 className="text-primary-950 pt-4 text-xs font-bold tracking-wider uppercase">
            SIMULATION ENGINE AND NUMERICAL INTEGRATION
          </h2>

          <p>
            SDOptimizer incorporates a temporal simulation engine that utilizes Euler numerical
            integration. Reasonable skill and care has been used in constructing this engine, but
            simulation outputs represent mathematical approximations of differential equations. We
            give no guarantee that the simulation outputs (including graphical curves and table
            statistics) are completely accurate, mathematically stable, or error-free.
          </p>

          <p>
            You are solely responsible for ensuring that model configurations (such as the
            integration Time Step &ldquo;DT&rdquo; and simulation duration) are set to stable and
            mathematically valid values to avoid division-by-zero or numerical explosion errors. We
            disclaim all liability arising from any reliance placed on simulated results.
          </p>

          <h2 className="text-primary-950 pt-4 text-sm font-bold tracking-wider uppercase">
            AI-DRIVEN POLICY OPTIMIZATION (DRL &amp; GREEDY ALGORITHMS)
          </h2>

          <p>
            Policy optimizations generated on this platform rely on hybrid learnheuristic
            algorithms, combining Deep Reinforcement Learning (DRL) agents and metaheuristic
            e-greedy search processes. Because System Dynamics models are simplified representations
            of real-world systems, optimized policies represent mathematical best-fits configured to
            maximize user-defined reward functions.
          </p>

          <p>
            You acknowledge that optimized policies do not represent a guarantee of actual system
            performance or real-world success. Any decisions made based on parameters generated by
            SDOptimizer are made at your own risk.
          </p>

          <h2 className="text-primary-950 pt-4 text-xs font-bold tracking-wider uppercase">
            CHANGES TO THESE TERMS OF USE
          </h2>

          <p>
            We may change these terms at any time by amending this page. Please check this page
            regularly to take notice of any such changes as you will be deemed to accept them
            through your continued use of SDOptimizer.
          </p>

          <h2 className="text-primary-950 pt-4 text-xs font-bold tracking-wider uppercase">
            CHANGES TO SDOPTIMIZER
          </h2>

          <p>
            We aim to update SDOptimizer regularly and may change the content or functionality at
            any time. If the need arises, we may suspend access to SDOptimizer, or close it
            indefinitely. We will not be liable if for any reason SDOptimizer is unavailable at any
            time or for any period.
          </p>

          <h2 className="text-primary-950 pt-4 text-xs font-bold tracking-wider uppercase">
            VIRUSES AND MALICIOUS PROGRAMS
          </h2>

          <p>
            We take reasonable precautions to prevent computer viruses or other items that may
            damage operation (&ldquo;Malicious Programs&rdquo;) on the website, but cannot accept
            liability for them. You must not misuse SDOptimizer by knowingly introducing Malicious
            Programs, attempting to gain unauthorized access to our servers, or attacking the
            website via denial-of-service attacks. In the event of such a breach, your right to use
            SDOptimizer will cease immediately.
          </p>

          <h2 className="text-primary-950 pt-4 text-xs font-bold tracking-wider uppercase">
            LIMITATION OF LIABILITY
          </h2>

          <p>
            SDOptimizer is provided &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo;. Except as
            required by law, we exclude all liability to you in respect of your use of the
            SDOptimizer platform, including errors in simulations, optimization run failures, or
            data loss.
          </p>

          <h2 className="text-primary-950 pt-4 text-xs font-bold tracking-wider uppercase">
            GOVERNING LAW
          </h2>

          <p>
            These Terms of Use are governed by and interpreted in accordance with the laws of the
            jurisdiction where the SDOptimizer project is hosted. Any disputes shall be subject to
            the non-exclusive jurisdiction of the local courts.
          </p>

          <h2 className="text-primary-950 pt-4 text-xs font-bold tracking-wider uppercase">
            CONTACT
          </h2>

          <p>
            If you have any comments or questions about SDOptimizer, please contact the project team
            at the engineering faculty or consult your academic supervisor.
          </p>
        </div>
      </article>
    </div>
  )
}
