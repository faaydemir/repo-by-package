import { useEffect, useRef, EffectCallback, DependencyList } from 'react';

function useUpdateEffect(effect: EffectCallback, deps?: DependencyList): void {
	const isInitialMount = useRef(true);

	useEffect(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false;
			return;
		}
		return effect();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);
}

export default useUpdateEffect;
