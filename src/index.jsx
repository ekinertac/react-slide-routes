/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { useEffect, useMemo, useRef, cloneElement, Children } from 'react';
import t from 'prop-types';
import { useLocation, Routes } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

const getCss = (duration, timing, direction) => css`
  display: grid;

  .item {
    grid-area: 1 / 1 / 2 / 2;

    &:not(:only-child) {
      &.${direction}-enter-active, &.${direction}-exit-active {
        transition: transform ${duration}ms ${timing};
      }
    }
  }

  &.slide {
    overflow: hidden;

    // back
    .back-enter {
      transform: translateX(-100%);
    }
    .back-enter-active {
      transform: translateX(0);
    }
    .back-exit {
      transform: translateX(0);
    }
    .back-exit-active {
      transform: translateX(100%);
    }

    // forward
    .forward-enter {
      transform: translateX(100%);
    }
    .forward-enter-active {
      transform: translateX(0);
    }
    .forward-exit {
      transform: translateX(0);
    }
    .forward-exit-active {
      transform: translateX(-100%);
    }
  }

  &.vertical-slide {
    overflow: hidden;

    // back
    .back-enter {
      transform: translateY(-100%);
    }
    .back-enter-active {
      transform: translateY(0);
    }
    .back-exit {
      transform: translateY(0);
    }
    .back-exit-active {
      transform: translateY(100%);
    }

    // forward
    .forward-enter {
      transform: translateY(100%);
    }
    .forward-enter-active {
      transform: translateY(0);
    }
    .forward-exit {
      transform: translateY(0);
    }
    .forward-exit-active {
      transform: translateY(-100%);
    }
  }

  &.rotate {
    perspective: 2000px;

    .item {
      backface-visibility: hidden;
    }

    // back
    .back-enter {
      transform: rotateY(-180deg);
    }
    .back-enter-active {
      transform: rotateY(0);
    }
    .back-exit {
      transform: rotateY(0);
    }
    .back-exit-active {
      transform: rotateY(180deg);
    }

    // forward
    .forward-enter {
      transform: rotateY(180deg);
    }
    .forward-enter-active {
      transform: rotateY(0);
    }
    .forward-exit {
      transform: rotateY(0);
    }
    .forward-exit-active {
      transform: rotateY(-180deg);
    }
  }
`;

const CACHE_KEY = '::slide::history::';

const SlideRoutes = ({ animation, pathList, duration, timing, destroy, disabled, children }) => {
  if (disabled) {
    return (
      <React.Fragment>
        {children}
      </React.Fragment>
    )
  }

  const location = useLocation();
  const { pathname } = location;

  const hasMount = useRef(false);
  const pathQueue = useRef();
  const SHOULD_UPDATE_CACHE = useRef(false);

  const prevPath = useRef();
  const direction = useRef('');

  if (!hasMount.current) {
    // mount
    hasMount.current = true;

    if (pathList.length > 0) {
      prevPath.current = pathname;
    } else {
      const cacheList = sessionStorage.getItem(CACHE_KEY);
      if (!cacheList) {
        prevPath.current = pathname;
        pathQueue.current = [pathname];
        SHOULD_UPDATE_CACHE.current = true;
      } else {
        pathQueue.current = JSON.parse(cacheList);
        prevPath.current = pathQueue.current[pathQueue.current.length - 1];
      }
    }
  } else {
    // update
    if (prevPath.current !== pathname) {
      if (pathList.length > 0) {
        const prevIndex = pathList.indexOf(prevPath.current);
        const nextIndex = pathList.indexOf(pathname);
        direction.current = prevIndex < nextIndex ? 'forward' : 'back';
      } else {
        const nextIndex = pathQueue.current.lastIndexOf(pathname);

        if (nextIndex === -1) {
          direction.current = 'forward';
          pathQueue.current.push(pathname);
        } else {
          direction.current = 'back';
          pathQueue.current.length = nextIndex + 1;
        }

        SHOULD_UPDATE_CACHE.current = true;
      }

      prevPath.current = pathname;
    }
  }

  const cssProps = useMemo(
    () => (destroy ? { timeout: duration } : { addEndListener() {} }),
    [destroy, duration]
  );

  useEffect(() => {
    if (SHOULD_UPDATE_CACHE.current) {
      SHOULD_UPDATE_CACHE.current = false;
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(pathQueue.current));
    }
  });

  const routList = useMemo(() => {
    return Children.map(children, (child) => {
      if (!child) return child;

      const { element, ...restProps } = child.props;
      if (!element || element.props.replace === true) return child;

      const newElement = <div className="item">{element}</div>;
      return { ...child, props: { ...restProps, element: newElement } };
    });
  }, [children]);

  return (
    <TransitionGroup
      className={`slide-routes ${animation}`}
      childFactory={(child) => cloneElement(child, { classNames: direction.current })}
      css={getCss(duration, timing, direction.current)}
    >
      <CSSTransition key={pathname} {...cssProps}>
        <Routes location={location}>{routList}</Routes>
      </CSSTransition>
    </TransitionGroup>
  );
};

SlideRoutes.defaultProps = {
  animation: 'slide',
  pathList: [],
  duration: 200,
  timing: 'ease',
  destroy: true,
  disabled: false
};

SlideRoutes.propTypes = {
  animation: t.oneOf(['slide', 'vertical-slide', 'rotate']),
  pathList: t.array,
  duration: t.number,
  timing: t.oneOf(['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear']),
  destroy: t.bool,
  disabled: t.bool,
  children: t.node,
};

export default SlideRoutes;
