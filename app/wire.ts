export type WireMessage = StateMessage | ActionEnvelopeMessage | SetupMessage;
export type WireMessageArguments = SetupArguments | StateMessageArguments | ActionMessage;

export interface WireMessageBase {
    type: string;
    sequence: number;
    arguments: WireMessageArguments;
}

export interface SetupArguments {
    robots: RobotData[];
    code: string;
    gridSize: Point;
}

// @type: "setup"
export interface SetupMessage extends WireMessageBase {
    _setup_message_brand: void;
    arguments: SetupArguments;
}

// @type: "state"
export interface StateMessage extends WireMessageBase {
    _state_message_brand: void;
    arguments: StateMessageArguments;
}

export interface StateMessageArguments {
    robot_state: RobotState;
    tick_info: TickData[]
}

export interface RobotState extends RobotData {
    health: number;
    energy: number;
}

export interface Point {
    x: number;
    y: number;
}

export interface TickData {
    in_view: ViewData;
    observations: Observation[];
    action_result: ActionResult;
}

export type ActionResult = HoldResult | MoveResult | ShootResult | ShieldResult | ScanResult;

export interface ActionResultBase {
    type: string;
}

export interface SuccessResult extends ActionResultBase {
    success: boolean;
}

// @type: "hold"
export interface HoldResult extends SuccessResult {
    _hold_result_brand: void;
}

export enum ObstacleType {
    Robot,
    Wall
}

// @type: "move"
export interface MoveResult extends SuccessResult {
    _move_result_brand: void;
    obstacle?: ObstacleType;
}

// @type: "shoot"
export interface ShootResult extends SuccessResult {
    _shoot_result_brand: void;
    robots_hit: RobotId[]
}

// @type: "shield"
export interface ShieldResult extends SuccessResult {
    _shield_result_brand: void;
}

// @type: "scan"
export interface ScanResult extends SuccessResult {
    _scan_result_brand: void;
    robots: RobotState[];
}

export interface ViewData {
    robots: RobotData[];
    regens: RegenData[];
}

export type RobotId = string;

export interface RobotData {
    name: RobotId;
    location: Point;
}

export interface RegenData {
    location: Point;
    value: number;
}

export type Observation = ShotObservation | ExplosionObservation | ShieldObservation;

export interface BaseObservation {
    type: string;
}

// @type: "shot"
export interface ShotObservation extends BaseObservation {
    _shot_observation_brand: void;
    location: Point;
}

// @type: "explosion"
export interface ExplosionObservation extends BaseObservation {
    _explosion_observation_brand: void;
    location: Point;
    radius: number;
}

// @type: "shield"
export interface ShieldObservation extends BaseObservation {
    _shield_observation_brand: void;
    location: Point;
}

// @type: "action"
export interface ActionEnvelopeMessage extends WireMessageBase {
    _action_envelope_message_brand: void;
    arguments: ActionMessage;
}

export type ActionMessage = HoldActionMessage | MoveActionMessage | ShootActionMessage | ShieldActionMessage | ScanActionMessage;

export interface ActionMessageBase {
    command: string;
}

export type ActionArguments = MoveActionArguments | ShootActionArguments | ShieldActionArguments;

export enum CardinalDirection {
    North,
    East,
    South,
    West
}

export interface MoveActionArguments {
    direction: CardinalDirection;
}

export interface ShootActionArguments {
    radius: number;
    location: Point;
}

export interface ShieldActionArguments {
    strength: number;
}

// @command: "move"
export interface MoveActionMessage extends ActionMessageBase {
    _move_action_message_brand: void;
    arguments: MoveActionArguments;
}

// @command: "hold"
export interface HoldActionMessage extends ActionMessageBase {
    _hold_action_message_brand: void;
}

// @command: "shoot"
export interface ShootActionMessage extends ActionMessageBase {
    _shoot_action_message_brand: void;
    arguments: ShootActionArguments;
}

// @command: "shield"
export interface ShieldActionMessage extends ActionMessageBase {
    _shield_action_message_brand: void;
    arguments: ShieldActionArguments;
}

// @command: "scan"
export interface ScanActionMessage extends ActionMessageBase {
    _scan_action_message_brand: void;
}
