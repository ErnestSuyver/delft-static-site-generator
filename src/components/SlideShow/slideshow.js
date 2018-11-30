import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Manifest,
  Fullscreen,
  RangeNavigationProvider,
  withBemClass,
  Responsive,
} from '@canvas-panel/core';
import {
  MobilePageView,
  SimpleSlideTransition,
  ProgressIndicator,
  Slide,
  CanvasNavigation,
} from '@canvas-panel/slideshow';

import ManifestCabinet from '../ManifestCabinet/ManifestCabinet';

import './slideshow.css';

const thumbnailCache = {};

const getThumbnails = (manifest, clearCache = false) => {
  const manifestId = manifest.id || manifest['@id'];
  if (!clearCache && thumbnailCache.hasOwnProperty(manifestId)) {
    return thumbnailCache[manifestId];
  }
  const thumbnails = manifest.getSequences().reduce(
    (sequenceThumbnails, sequence) => 
      Object.assign(
        sequenceThumbnails, 
        sequence.getCanvases().reduce((canvasThumbnails, canvas) => { 
          canvasThumbnails[canvas.id || canvas['@id']] = canvas.getThumbnail();
          return canvasThumbnails;
        }, {})
      )
    , {});
  thumbnailCache[manifestId] = thumbnails;
  return thumbnails;
}

class SlideShow extends Component {
  state = {
    innerWidth: window.innerWidth,
  };

  static propTypes = {
    jsonld: PropTypes.object,
    mobileBreakpoint: PropTypes.number,
  };

  static defaultProps = {
    mobileBreakpoint: 767,
  };

  componentWillMount() {
    window.addEventListener('resize', this.setSize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setSize);
  }

  setSize = () => {
    this.setState({ innerWidth: window.innerWidth });
  };

  qualifiesForMobile = () => {
    return this.state.innerWidth <= this.props.mobileBreakpoint;
  };

  render() {
    const { jsonld, renderPanel, bem } = this.props;
    return (
      <div
        className={bem.modifiers({
          isMobile: Responsive.md.phone(),
        })}
      >
        <Fullscreen>
          {({ ref, ...fullscreenProps }) => (
            <Manifest jsonLd={jsonld}>
              <RangeNavigationProvider>
                {rangeProps => {
                  const {
                    manifest,
                    canvas,
                    canvasList,
                    currentIndex,
                    previousRange,
                    nextRange,
                    region,
                    goToRange,
                  } = rangeProps;
                  const allThumbnails = getThumbnails(manifest);
                        
                  return (
                    <>
                    <div className={bem.element('inner-frame')} ref={ref}>
                      {this.qualifiesForMobile() ? (
                        <MobilePageView
                          manifest={manifest}
                          previousRange={previousRange}
                          nextRange={nextRange}
                          fullscreenProps={fullscreenProps}
                          {...rangeProps}
                        />
                      ) : (
                        <React.Fragment>
                          <SimpleSlideTransition id={currentIndex}>
                            <Slide
                              fullscreenProps={fullscreenProps}
                              behaviors={canvas.__jsonld.behavior || []}
                              manifest={manifest}
                              canvas={canvas}
                              region={region}
                              renderPanel={renderPanel}
                            />
                          </SimpleSlideTransition>
                          <CanvasNavigation
                            previousRange={previousRange}
                            nextRange={nextRange}
                            canvasList={canvasList}
                            currentIndex={currentIndex}
                          />
                          <ProgressIndicator
                            currentCanvas={currentIndex}
                            totalCanvases={canvasList.length}
                          />
                        </React.Fragment>
                      )}
                    </div>
                    <ManifestCabinet 
                      currentCanvas={canvas}
                      allThumbnails={allThumbnails}
                      canvasList={canvasList}
                      height={116}
                      goToRange={goToRange}
                    >
                      <CanvasNavigation
                        previousRange={previousRange}
                        nextRange={nextRange}
                        canvasList={canvasList}
                        currentIndex={currentIndex}
                      />
                    </ManifestCabinet>
                    </>
                  );
                }}
              </RangeNavigationProvider>
            </Manifest>
          )}
        </Fullscreen>
      </div>
    );
  }
}
// NOTE: this is because Gatsby.js client only hack...
export default typeof withBemClass === 'function' ? withBemClass('slideshow')(SlideShow) : SlideShow;