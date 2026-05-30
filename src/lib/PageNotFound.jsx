import { Link, useLocation } from 'react-router-dom';

export default function PageNotFound() {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    return (
        <div
            className="min-h-screen flex items-center justify-center p-6"
            style={{ background: 'var(--lark-bg, #080808)', color: 'var(--lark-text, #f0eef6)' }}
        >
            <div className="max-w-md w-full">
                <div className="text-center space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-7xl font-light opacity-30">404</h1>
                        <div className="h-0.5 w-16 mx-auto" style={{ background: 'rgba(139,92,246,0.35)' }} />
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-2xl font-medium">Page Not Found</h2>
                        <p className="opacity-70 leading-relaxed">
                            The page <span className="font-medium opacity-90">"{pageName}"</span> could not be found.
                        </p>
                    </div>

                    <div className="pt-6">
                        <Link
                            to="/"
                            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
                            style={{
                              border: '1px solid rgba(139,92,246,0.35)',
                              color: '#a78bfa',
                              background: 'rgba(139,92,246,0.08)',
                            }}
                        >
                            Go Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
