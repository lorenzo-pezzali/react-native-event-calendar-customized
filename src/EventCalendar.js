// @flow
import {
  VirtualizedList,
  View,
  TouchableOpacity,
  Image,
  Text,
} from 'react-native';
import _ from 'lodash';
import moment from 'moment';
import React from 'react';

import styleConstructor from './style';

import DayView from './DayView';

export default class EventCalendar extends React.Component {
  constructor(props) {
    super(props);

    const start = props.start ? props.start : 0;
    const end = props.end ? props.end : 24;

    this.styles = styleConstructor(props.styles, (end - start) * 100);
    this.state = {
      date: moment(this.props.initDate),
      index: this.props.size,
    };

    this._renderItem = this._renderItem.bind(this);
    this._getItem = this._getItem.bind(this);
    this._getItemLayout = this._getItemLayout.bind(this);
    this._getItemCount = this._getItemCount.bind(this);
  }

  componentDidMount() {
    if (this.props.onRef) {
      this.props.onRef(this);
    }
  }

  componentWillUnmount() {
    if (this.props.onRef) {
      this.props.onRef(undefined);
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      JSON.stringify(this.props) != JSON.stringify(nextProps) ||
      JSON.stringify(this.state) != JSON.stringify(nextState)
    );
  }

  static defaultProps = {
    size: 30,
    initDate: new Date(),
    formatHeader: 'DD MMMM YYYY',
  };

  _getItemCount() {
    return this.props.size * 2;
  }

  _getItemLayout(data, index) {
    const { width } = this.props;
    return { length: width, offset: width * index, index };
  }

  _getItem(events, index) {
    return _.filter(events, event => {
      return event.dayOfYear == index + 1;
    });
  }

  _renderItem({ index, item }) {
    const {
      width,
      format24h,
      initDate,
      scrollToFirst = true,
      start = 0,
      end = 24,
      formatHeader,
      upperCaseHeader = false,
    } = this.props;
    const date = moment(initDate).add(index - this.props.size, 'days');

    const leftIcon = this.props.headerIconLeft ? (
      this.props.headerIconLeft
    ) : (
      <Image source={require('./back.png')} style={this.styles.arrow} />
    );
    const rightIcon = this.props.headerIconRight ? (
      this.props.headerIconRight
    ) : (
      <Image source={require('./forward.png')} style={this.styles.arrow} />
    );

    let headerText = upperCaseHeader
      ? date.format(formatHeader || 'DD MMMM YYYY').toUpperCase()
      : date.format(formatHeader || 'DD MMMM YYYY');

    return (
      <View style={[this.styles.container, { width }]}>
        {this.props.renderDateHeader ? (
          this.props.renderDateHeader(date)
        ) : (
          <View style={this.styles.header}>
            <TouchableOpacity
              style={this.styles.arrowButton}
              onPress={this._previous}
            >
              {leftIcon}
            </TouchableOpacity>
            <View style={this.styles.headerTextContainer}>
              <Text style={this.styles.headerText}>{headerText}</Text>
            </View>
            <TouchableOpacity
              style={this.styles.arrowButton}
              onPress={this._next}
            >
              {rightIcon}
            </TouchableOpacity>
          </View>
        )}
        <DayView
          date={date}
          index={index}
          format24h={format24h}
          formatHeader={this.props.formatHeader}
          headerStyle={this.props.headerStyle}
          renderEvent={this.props.renderEvent}
          eventTapped={this.props.eventTapped}
          outsideClickHandler={this.props.outsideClickHandler}
          dragDownRefreshing={this.props.dragDownRefreshing}
          onRefreshHandler={this.props.onRefreshHandler}
          events={item}
          width={width}
          styles={this.styles}
          scrollToFirst={scrollToFirst}
          start={start}
          end={end}
        />
      </View>
    );
  }

  _goToPage(index) {
    if (index < 0 || index >= this.props.size * 2) {
      return;
    }
    this.refs.calendar.scrollToIndex({ index, animated: false });
  }

  _goToDate(date) {
    const earliestDate = moment(this.props.initDate).subtract(
      this.props.size,
      'days'
    );
    const index = moment(date).diff(earliestDate, 'days');
    this._goToPage(index);
  }

  _previous = () => {
    this._goToPage(this.state.index - 1);
    if (this.props.dateChanged) {
      this.props.dateChanged(
        moment(this.props.initDate)
          .add(this.state.index - 1 - this.props.size, 'days')
          .format('YYYY-MM-DD')
      );
    }
  };

  _next = () => {
    this._goToPage(this.state.index + 1);
    if (this.props.dateChanged) {
      this.props.dateChanged(
        moment(this.props.initDate)
          .add(this.state.index + 1 - this.props.size, 'days')
          .format('YYYY-MM-DD')
      );
    }
  };

  render() {
    const { width, virtualizedListProps, events } = this.props;

    return (
      <View style={[this.styles.container, { width }]}>
        <VirtualizedList
          ref="calendar"
          windowSize={2}
          initialNumToRender={2}
          initialScrollIndex={this.props.size}
          data={events}
          getItemCount={this._getItemCount}
          getItem={this._getItem}
          keyExtractor={(item, index) => index.toString()}
          getItemLayout={this._getItemLayout}
          horizontal
          pagingEnabled
          renderItem={this._renderItem}
          style={{ width: width }}
          onMomentumScrollEnd={event => {
            const index = parseInt(event.nativeEvent.contentOffset.x / width);
            const date = moment(this.props.initDate).add(
              index - this.props.size,
              'days'
            );
            if (this.props.dateChanged) {
              this.props.dateChanged(date.format('YYYY-MM-DD'));
            }
          }}
          {...virtualizedListProps}
        />
      </View>
    );
  }
}
