<div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMessage(null);
                }}
                className="text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {isSignUp ? 'Já possui credencial? Fazer login' : 'Primeiro acesso? Criar nova conta'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
