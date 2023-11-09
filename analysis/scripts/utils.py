import os
import random
import pandas as pd
import numpy as np
from scipy.stats import shapiro, friedmanchisquare, mannwhitneyu, wilcoxon, f_oneway, kruskal
from sklearn.calibration import CalibratedClassifierCV
from statsmodels.stats.anova import AnovaRM
from scikit_posthocs import posthoc_nemenyi_friedman, posthoc_dunn
from scipy.stats import tukey_hsd
import seaborn as sns
import matplotlib.pyplot as plt
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import MinMaxScaler, OrdinalEncoder, PowerTransformer
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.feature_selection import SelectFromModel
from xgboost import XGBClassifier
from catboost import CatBoostClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from lightgbm import LGBMClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC, LinearSVC
from sklearn.model_selection import GridSearchCV
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.metrics import roc_curve
from catboost import Pool
from sklearn.naive_bayes import GaussianNB
from sklearn.feature_selection import SelectKBest, f_classif
from IPython.core.display import HTML
from scikitplot.metrics import plot_roc_curve
from sklearn.model_selection import RandomizedSearchCV
from sklearn.model_selection import GroupShuffleSplit
from warnings import filterwarnings

pd.options.display.float_format = '{:,.4f}'.format


def my_shapiro(data, columns, verbose=False):
    count = 0
    for column in columns:
        _, p = shapiro(data[column])
        if(verbose):
             print('{}:\n  p-value: {} '.format(column, p if p > 0.0005 else '<0.0005'))
        if(p > 0.05):
            count += 1
    print('{}/{} normally distributed metrics.'.format(count, len(columns)))


def my_friedman(data, columns, sample_column, sample_names):
    pairs = [(a, b) for idx, a in enumerate([x for x in range(len(sample_names))]) for b in [x for x in range(len(sample_names))][idx + 1:]]
    named_pairs = [(a, b) for idx, a in enumerate(sample_names) for b in sample_names[idx + 1:]]
    posthoc_columns = [str(x[0])+'__'+str(x[1]) for x in named_pairs]
    results = pd.DataFrame(columns=['Feature name', 'p', 'Q', 'effsize', 'significant'] + posthoc_columns)                   
    for column in columns:
        samples = [data[data[sample_column] == sample_name][column] for sample_name in sample_names]
        stat, p = friedmanchisquare(*samples)
        post_hoc = [None for x in range(len(named_pairs))]
        if(p < 0.05):
            post_hoc = posthoc_nemenyi_friedman(np.transpose(samples))
            post_hoc = ['< .001' if post_hoc.iloc[x[0],x[1]] <= 0.001 else str(np.round(post_hoc.iloc[x[0],x[1]], 3)) for x in pairs]
        results.loc[len(results.index)] = [item for sublist in [[
            column, 
            '< .001' if p <= 0.001 else str(np.round(p, 3)), 
            np.round(stat, 2), 
            str(np.round(stat/((len(samples[0]) * (len(samples)-1))), 2)),
            p < 0.05
        ], post_hoc] for item in sublist]
    return results


def my_anova(data, columns, sample_column, sample_names):
    pairs = [(a, b) for idx, a in enumerate([x for x in range(len(sample_names))]) for b in [x for x in range(len(sample_names))][idx + 1:]]
    named_pairs = [(a, b) for idx, a in enumerate(sample_names) for b in sample_names[idx + 1:]]
    posthoc_columns = [str(x[0])+'__'+str(x[1]) for x in named_pairs]
    results = pd.DataFrame(columns=['feature', 'p_value', 'F_statistic', 'significant'] + posthoc_columns)                   
    for column in columns:
        samples = [data[data[sample_column] == sample_name][column].astype('int') for sample_name in sample_names]
        stat, p = f_oneway(*samples)
        post_hoc = [None for x in range(len(named_pairs))]
        if(p < 0.05):
            post_hoc = tukey_hsd(*samples)
            post_hoc = ['< .001' if post_hoc.pvalue[x[0]][x[1]] <= 0.001 else str(np.round(post_hoc.pvalue[x[0]][x[1]], 3)) for x in pairs]
        results.loc[len(results.index)] = [item for sublist in [[
            column, 
            '< .001' if p <= 0.001 else str(np.round(p, 3)), 
            np.round(stat, 2), 
            p < 0.05
        ], post_hoc] for item in sublist]
    return results


def my_kruskal(data, columns, sample_column, sample_names):
    pairs = [(a, b) for idx, a in enumerate([x for x in range(len(sample_names))]) for b in [x for x in range(len(sample_names))][idx + 1:]]
    named_pairs = [(a, b) for idx, a in enumerate(sample_names) for b in sample_names[idx + 1:]]
    posthoc_columns = [str(x[0])+'__'+str(x[1]) for x in named_pairs]
    results = pd.DataFrame(columns=['feature', 'p_value', 'F_statistic', 'effsize', 'significant'] + posthoc_columns)                   
    for column in columns:
        samples = [data[data[sample_column] == sample_name][column].astype('int') for sample_name in sample_names]
        stat, p = kruskal(*samples)
        post_hoc = [None for x in range(len(named_pairs))]
        if(p < 0.05):
            post_hoc = posthoc_dunn(samples)
            post_hoc = ['< .001' if post_hoc.iloc[x[0],x[1]] <= 0.001 else str(np.round(post_hoc.iloc[x[0],x[1]], 3)) for x in pairs]
        results.loc[len(results.index)] = [item for sublist in [[
            column, 
            '< .001' if p <= 0.001 else str(np.round(p, 3)), 
            np.round(stat, 2), 
            str(np.round((stat - len(samples) + 1)/(len(np.array(samples).flatten()) - len(samples)), 2)),
            p < 0.05
        ], post_hoc] for item in sublist]
    return results


def my_mannwhitney(data, columns, sample_column, sample_names):
    results = pd.DataFrame(columns=['Feature name', 'p', 'U', 'z', 'effsize', 'significant'])
    for column in columns:
        samples = [data[data[sample_column] == sample_name][column] for sample_name in sample_names]
        stat, p = mannwhitneyu(*samples)
        nx = len(data[data[sample_column] == sample_names[0]])
        ny = len(data[data[sample_column] == sample_names[1]])
        z = (stat - nx*ny/2 + 0.5) / np.sqrt(nx*ny * (nx + ny + 1)/ 12)
        eff = z/np.sqrt(nx+ny)
        results.loc[len(results.index)] = [column, '< .001' if p <= 0.001 else str(np.round(p, 3)), np.round(stat, 2), np.round(z, 2), np.round(eff, 2), p < 0.05]
    return results


def my_kdeplot(data, columns, hue):
    fig = plt.figure(figsize=(25, 100))
    fig.subplots_adjust(hspace=0.4, wspace=0.2)
    for i, column in enumerate(columns):
        ax = fig.add_subplot(36, 3, i+1)
        sns.kdeplot(
            data=data, x=column, hue=hue, ax=ax)

   
def my_select_features(predictors, target, estimator):
    selection = SelectFromModel(estimator=estimator)
    selection.fit(predictors, target)
    return selection.get_support()

# def my_model_eval(predictors, target, estimator, folds):
#     score = cross_validate(
#         estimator, 
#         predictors, 
#         target, 
#         cv=StratifiedKFold(n_splits=folds, shuffle=True, random_state=1), 
#         scoring = ['accuracy', 'precision', 'recall', 'f1', 'roc_auc'],
#         return_estimator = True
#     )
#     return score

# def my_eval(predictors, target, estimator):
#     score = my_model_eval(predictors, target, estimator, 5)
#     print("Accuracy: ", np.average(score['test_accuracy']))
#     print("Precision: ", np.average(score['test_precision']))
#     print("Recall: ", np.average(score['test_recall']))
#     print("F1: ", np.average(score['test_f1']))
#     print("AUC: ", np.average(score['test_roc_auc']))
#     return score

# def my_try_models(predictors, target, predictors_test=None, target_test=None):
#     scores = {}
#     test_scores = {}
#     for model in [
#         LogisticRegression(),
#         CalibratedClassifierCV(LinearSVC()),
#         RandomForestClassifier(),
#         XGBClassifier(), 
#         LGBMClassifier(),
#         CatBoostClassifier(logging_level='Silent')
#     ]:
#         score = my_model_eval(predictors, target, model, 5)
#         scores[type(model).__name__] = score
#         if(predictors_test is not None and target_test is not None):
#             model.fit(predictors, target)
#             test_scores[type(model).__name__] = classification_report(target_test, model.predict(predictors_test), output_dict=True)
#             test_scores[type(model).__name__]['roc'] = roc_auc_score(target_test, model.predict_proba(predictors_test)[:,1])

#     results = pd.DataFrame(columns=['Model', 'Accuracy', 'Precision', 'Recall', 'F1 score', 'AUC score', 'Type'])
#     for name in scores:
#         results.loc[len(results)] = [
#             name, 
#             np.average(scores[name]['test_accuracy']), 
#             np.average(scores[name]['test_precision']), 
#             np.average(scores[name]['test_recall']), 
#             np.average(scores[name]['test_f1']), 
#             np.average(scores[name]['test_roc_auc']),
#             'cross-validation'
#         ]
#     for name in test_scores:
#         results.loc[len(results)] = [
#             name, 
#             test_scores[name]['accuracy'], 
#             test_scores[name]['macro avg']['precision'], 
#             test_scores[name]['macro avg']['recall'], 
#             test_scores[name]['macro avg']['f1-score'],
#             test_scores[name]['roc'],
#             'testing'
#         ]
#     return results

sensitivity_settings = ['dell2400 sys5', 'dell2400 sys10', 'dell2400 sys18']
dpi_settings = ['micr1000 sys10', 'dell2400 sys10', 'trust4800 sys10']
useless_columns = ['acceleration_x_median', 'acceleration_y_median', 'velocity_min', 'velocity_x_min', 'velocity_x_q5', 'velocity_y_min', 'velocity_y_q5', 'distance_min', 'angle_max', 'pace_min', 'velocity_angular_median', 'curvature_median', 'velocity_smooth_min']
filter_columns = ['setting_string', 'respondent_id', 'session_id', 'task_id', 'sex', 'age', 'next_target_number', 'prototype_id', 'game_number']

# random train test split respondent-ids
train_ids = [
    ['14', '27', '29', '6', '28', '21', '12', '16', '17', '15', '26', '22', '20', '32', '19', '18', '31', '9', '33', '4', '23', '8', '2', '25'], 
    ['13', '18', '22', '16', '2', '21', '5', '31', '11', '17', '28', '20', '9', '26', '23', '29', '10', '25', '30', '7', '8', '27', '19', '14'], 
    ['2', '31', '26', '6', '18', '11', '10', '17', '7', '19', '24', '15', '32', '13', '28', '14', '21', '25', '29', '20', '30', '16', '5', '27'], 
    ['10', '24', '9', '28', '21', '26', '31', '15', '33', '2', '13', '16', '18', '30', '12', '4', '5', '17', '23', '20', '14', '32', '19', '7'], 
    ['2', '6', '24', '33', '17', '26', '27', '28', '5', '29', '11', '23', '30', '32', '7', '3', '19', '16', '14', '15', '4', '13', '8', '20'], 
    ['5', '22', '33', '14', '31', '9', '32', '24', '19', '18', '4', '16', '10', '2', '8', '28', '23', '17', '13', '12', '7', '15', '29', '26'], 
    ['27', '12', '11', '8', '4', '20', '13', '19', '21', '15', '9', '30', '6', '23', '10', '16', '3', '24', '5', '29', '32', '31', '25', '26'], 
    ['18', '15', '13', '23', '9', '32', '22', '6', '8', '20', '30', '12', '31', '24', '19', '2', '26', '7', '3', '27', '17', '10', '21', '14'], 
    ['3', '25', '19', '28', '14', '23', '7', '12', '17', '16', '33', '4', '32', '29', '13', '26', '15', '5', '9', '8', '31', '24', '11', '18'], 
    ['4', '16', '27', '7', '2', '28', '25', '11', '6', '13', '19', '9', '18', '30', '17', '22', '10', '26', '15', '20', '21', '23', '12', '32']
]
test_ids = [
    ['24', '30', '13', '3', '7', '5', '10', '11'], 
    ['15', '32', '4', '6', '3', '33', '24', '12'], 
    ['9', '12', '4', '33', '23', '22', '8', '3'], 
    ['27', '8', '29', '25', '6', '3', '11', '22'], 
    ['22', '9', '21', '12', '10', '31', '25', '18'], 
    ['20', '3', '11', '21', '6', '27', '30', '25'], 
    ['18', '22', '14', '28', '2', '7', '17', '33'], 
    ['16', '28', '33', '5', '25', '29', '11', '4'], 
    ['20', '27', '6', '2', '22', '10', '21', '30'], 
    ['8', '31', '33', '5', '14', '3', '29', '24']
]

train_ids = [[int(y) for y in x] for x in train_ids]
test_ids = [[int(y) for y in x] for x in test_ids]
