import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconPresentationProvider,
  Icons,
  NavBar,
  ToolButton,
  useModal,
} from '@ohif/ui-next';
import { Types, useSystem } from '@ohif/core';
import { Toolbar, usePatientInfo } from '@ohif/extension-default';
import ToothSelector from './ToothSelector';
import {
  setActiveDentalTooth,
  getActiveDentalTooth,
  DentalToothSelection,
} from '../dentalMeasurementsManager';

const getPracticeName = (appConfig: any) => {
  const overrides = appConfig?.whiteLabeling?.overrides as Record<string, any> | undefined;
  return (
    overrides?.practiceName || overrides?.siteName || appConfig?.whiteLabeling?.siteName || 'Dental Practice'
  );
};

const DentalPracticeHeader: React.FC<{ appConfig: any }> = ({
  appConfig,
}) => {
  const { servicesManager, extensionManager, commandsManager } = useSystem();
  const { customizationService } = servicesManager.services;
  const { patientInfo } = usePatientInfo();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { show } = useModal();
  const practiceName = useMemo(() => getPracticeName(appConfig), [appConfig]);
  const [isDentalTheme, setIsDentalTheme] = useState(() =>
    typeof window !== 'undefined' ? document.body.classList.contains('dental-theme') : false
  );
  const [toothSelection, setToothSelection] = useState<DentalToothSelection>(
    () => getActiveDentalTooth() || { system: 'FDI', value: '11' }
  );

  useEffect(() => {
    setActiveDentalTooth(toothSelection);
  }, [toothSelection]);

  useEffect(() => {
    if (isDentalTheme) {
      document.body.classList.add('dental-theme');
    } else {
      document.body.classList.remove('dental-theme');
    }

    return () => {
      document.body.classList.remove('dental-theme');
    };
  }, [isDentalTheme]);

  const onClickReturnButton = () => {
    const { pathname } = location;
    const dataSourceIdx = pathname.indexOf('/', 1);
    const dataSourceName = pathname.substring(dataSourceIdx + 1);
    const existingDataSource = extensionManager.getDataSources(dataSourceName);
    const searchQuery = new URLSearchParams();
    if (dataSourceIdx !== -1 && existingDataSource) {
      searchQuery.append('datasources', pathname.substring(dataSourceIdx + 1));
    }

    navigate({
      pathname: '/',
      search: decodeURIComponent(searchQuery.toString()),
    });
  };

  const AboutModal = customizationService.getCustomization(
    'ohif.aboutModal'
  ) as Types.MenuComponentCustomization;

  const UserPreferencesModal = customizationService.getCustomization(
    'ohif.userPreferencesModal'
  ) as Types.MenuComponentCustomization;

  const menuOptions = [
    {
      title: AboutModal?.menuTitle ?? t('Header:About'),
      icon: 'info',
      onClick: () =>
        show({
          content: AboutModal,
          title: AboutModal?.title ?? t('AboutModal:About OHIF Viewer'),
          containerClassName: AboutModal?.containerClassName ?? 'max-w-md',
        }),
    },
    {
      title: UserPreferencesModal?.menuTitle ?? t('Header:Preferences'),
      icon: 'settings',
      onClick: () =>
        show({
          content: UserPreferencesModal,
          title: UserPreferencesModal?.title ?? t('UserPreferencesModal:User preferences'),
          containerClassName:
            UserPreferencesModal?.containerClassName ?? 'flex max-w-4xl p-6 flex-col',
        }),
    },
  ];

  if (appConfig.oidc) {
    menuOptions.push({
      title: t('Header:Logout'),
      icon: 'power-off',
      onClick: async () => {
        navigate(`/logout?redirect_uri=${encodeURIComponent(window.location.href)}`);
      },
    });
  }

  const isReturnEnabled = !!appConfig.showStudyList;

  const renderLogo = () =>
    appConfig.whiteLabeling?.createLogoComponentFn?.(React, { appConfig }) || <Icons.OHIFLogo />;

  return (
    <IconPresentationProvider
      size="large"
      IconContainer={ToolButton}
    >
      <NavBar className="py-2">
        <div className="flex items-center justify-between w-full px-4">
          {/* Left Section - Logo and Return */}
          <div className="flex items-center gap-4 min-w-0 flex-shrink-0">
            <div
              className={classNames(
                'flex items-center gap-2 text-primary',
                isReturnEnabled && 'cursor-pointer'
              )}
              onClick={() => {
                if (isReturnEnabled) {
                  onClickReturnButton();
                }
              }}
              data-cy="return-to-work-list"
            >
              {isReturnEnabled && <Icons.ArrowLeft className="h-6 w-6" />}
              <div className="flex items-center">{renderLogo()}</div>
            </div>
          </div>

          {/* Center Section - Practice Info and Controls */}
          <div className="flex flex-col items-center gap-2 flex-1 max-w-2xl">
            {/* Top Row - Practice Name and Theme Toggle */}
            <div className="flex items-center gap-4">
              <span className="text-lg font-semibold text-dental-accent whitespace-nowrap">{practiceName}</span>
              <Button
                variant="ghost"
                className="dental-pill-button flex items-center gap-2 px-3 py-1 text-xs uppercase tracking-widest whitespace-nowrap"
                onClick={() => setIsDentalTheme(current => !current)}
              >
                <span role="img" aria-label="dental theme">🦷</span>
                {isDentalTheme ? 'Dental mode' : 'Standard mode'}
              </Button>
              <ToothSelector
                selection={toothSelection}
                onChange={setToothSelection}
              />
            </div>
            
            {/* Bottom Row - Toolbar */}
            <div className="flex items-center gap-2">
              <Toolbar buttonSection="primary" />
            </div>
          </div>

          {/* Right Section - Patient Info and Actions */}
          <div className="flex items-center gap-4 min-w-0 flex-shrink-0">
            {/* Undo/Redo */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="dental-button-ghost p-2"
                onClick={() => commandsManager.run('undo')}
              >
                <Icons.Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="dental-button-ghost p-2"
                onClick={() => commandsManager.run('redo')}
              >
                <Icons.Redo className="h-4 w-4" />
              </Button>
            </div>

            {/* Patient Info */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col text-right min-w-0">
                <span className="text-sm font-semibold text-white truncate">
                  {patientInfo.PatientName || 'Patient unknown'}
                </span>
                <span className="text-xs text-dental-muted truncate">
                  {patientInfo.PatientID ? `ID: ${patientInfo.PatientID}` : 'No patient ID'}
                </span>
              </div>
              
              {/* Settings Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:bg-primary-dark p-2"
                  >
                    <Icons.GearSettings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {menuOptions.map((option, index) => {
                    const IconComponent = option.icon
                      ? Icons[option.icon as keyof typeof Icons]
                      : null;
                    return (
                      <DropdownMenuItem
                        key={index}
                        onSelect={option.onClick}
                        className="flex items-center gap-2 py-2"
                      >
                        {IconComponent && (
                          <span className="flex h-4 w-4 items-center justify-center">
                            <Icons.ByName name={option.icon} />
                          </span>
                        )}
                        <span className="flex-1">{option.title}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </NavBar>
    </IconPresentationProvider>
  );
};

export default DentalPracticeHeader;
