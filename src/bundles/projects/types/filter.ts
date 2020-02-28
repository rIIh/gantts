import { AssignedFilter, DatesFilter } from '../components/lazyGantt/FilterHeader';
import { LazyTask, TaskType } from './index';
import { LazyUserInfo } from '../../user/types';
import { Colors, Palette } from '../colors';

export interface Filters {
  dateFilter: DatesFilter;
  usersFilter: AssignedFilter;
  colorsFilter: Colors<Palette>[];
  hideCompleted: boolean;
}

type Filter = (model: Pick<LazyTask, 'start' | 'end' | 'type' | 'progress' >) => boolean;

const today = Date.today;

export const datesFilters: Map<DatesFilter, Filter> = new Map<DatesFilter, Filter>([
  [DatesFilter.All                    , () => true],
  [DatesFilter.DueToday               , ({ end }) => end && end.isToday(today()) || false],
  [DatesFilter.Overdue                , ({ end }) => end && end.compareTo(today()) < 0 || false],
  [DatesFilter.InProgress             , ({ start, end }) => start && end && today().between(start, end) || false],
  [DatesFilter.DueWithinOneWeek       , ({ end }) => end && end.between(today(), today().addWeeks(1)) || false],
  [DatesFilter.DueWithinTwoWeek       , ({ end }) => end && end.between(today(), today().addWeeks(2)) || false],
  [DatesFilter.DueWithinFourWeek      , ({ end }) => end && end.between(today(), today().addWeeks(4)) || false],
  [DatesFilter.StartingWithinOneWeek  , ({ start }) => start && start.between(today(), today().addWeeks(1)) || false],
  [DatesFilter.StartingWithinTwoWeek  , ({ start }) => start && start.between(today(), today().addWeeks(2)) || false],
  [DatesFilter.StartingWithinFourWeek , ({ start }) => start && start.between(today(), today().addWeeks(4)) || false],
  [DatesFilter.OnlyMilestones         , ({ type }) => type == TaskType.Milestone],
  [DatesFilter.NotScheduled           , ({ start, end }) => !start && !end],
  [DatesFilter.Completed              , ({ progress }) => progress == 100],
]);
